#!/usr/bin/env python3
"""
IPRN API Client & Website Data Synchronizer - Production Ready
Handles secure real-time sync with https://ksiiprn.com/api/v1/iprn
Saves consolidated metric updates into 'iprn_sync.json'
No external dependencies (uses standard library urllib)
"""

import os
import sys
import json
import time
import random
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from functools import wraps
import logging
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("IPRN-Sync")


class MessageType(Enum):
    """Message type enumeration."""
    A2P = "a2p"
    P2P = "p2p"
    ALL = "all"


class GroupBy(Enum):
    """Group by options for statistics."""
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


@dataclass
class RateLimit:
    """Rate limit information."""
    limit: int = 60
    remaining: int = 60
    reset: int = 0
    retry_after: int = 0


class IPRNAPIError(Exception):
    """Custom exception for IPRN API errors."""
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(f"{code}: {message}")


def rate_limit_handler(func):
    """Decorator to handle rate limiting with exponential backoff."""
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                # Check if we need to wait for rate limit reset
                if self.rate_limit.remaining == 0 and self.rate_limit.reset:
                    wait_time = self.rate_limit.reset - time.time()
                    if wait_time > 0:
                        logger.warning(f"Rate limit exhausted. Waiting {wait_time:.2f} seconds")
                        time.sleep(wait_time + 1)
                
                return func(self, *args, **kwargs)
                
            except IPRNAPIError as e:
                if e.code == "RATE_LIMIT_EXCEEDED" and attempt < max_retries - 1:
                    sleep_time = retry_delay * (2 ** attempt)
                    logger.warning(f"Rate limit exceeded. Retry in {sleep_time} seconds (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(sleep_time)
                    continue
                raise
                
        raise IPRNAPIError("MAX_RETRIES", "Maximum retry attempts exceeded")
    
    return wrapper


class IPRNClient:
    """
    IPRN API Client with comprehensive rate limiting and error handling.
    Optimized for real-time website data synchronization using standard urllib.
    """
    
    BASE_URL = "https://ksiiprn.com/api/v1/iprn"
    DEFAULT_API_KEY = "sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the IPRN client.
        Securely reads the API Key from environment or falls back to the production live key.
        """
        self.api_key = api_key or os.getenv("IPRN_API_KEY") or self.DEFAULT_API_KEY
        self.rate_limit = RateLimit()
        
        # Set up headers
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'IPRN-Website-Sync/1.0'
        }
        
        # Obfuscate API Key in logs for security
        masked_key = f"{self.api_key[:8]}...{self.api_key[-6:]}" if len(self.api_key) > 15 else "HIDDEN"
        logger.info(f"IPRN Client initialized with API key: {masked_key}")
    
    def _update_rate_limits(self, headers) -> None:
        """Update rate limit information from response headers."""
        try:
            if 'X-RateLimit-Limit' in headers:
                self.rate_limit.limit = int(headers['X-RateLimit-Limit'])
            if 'X-RateLimit-Remaining' in headers:
                self.rate_limit.remaining = int(headers['X-RateLimit-Remaining'])
            if 'X-RateLimit-Reset' in headers:
                self.rate_limit.reset = int(headers['X-RateLimit-Reset'])
            if 'Retry-After' in headers:
                self.rate_limit.retry_after = int(headers['Retry-After'])
        except (ValueError, KeyError) as e:
            logger.warning(f"Could not parse rate limit headers: {e}")

    def _fetch_endpoint(self, endpoint: str) -> Dict[str, Any]:
        """Fetch json from specified endpoint relative to BASE_URL with robust 429 rate limit backoff."""
        url = f"{self.BASE_URL}/{endpoint.lstrip('/')}"
        
        for attempt in range(4):
            req = urllib.request.Request(url, headers=self.headers, method='GET')
            try:
                with urllib.request.urlopen(req, timeout=15) as response:
                    status_code = response.status
                    self._update_rate_limits(response.info())
                    body = response.read().decode('utf-8')
                    try:
                        data = json.loads(body)
                        if isinstance(data, dict):
                            return data
                        return {"success": True, "data": data}
                    except json.JSONDecodeError:
                        return {"success": True, "status_code": status_code}
            except urllib.error.HTTPError as e:
                self._update_rate_limits(e.headers)
                if e.code == 429:
                    retry_sec = (self.rate_limit.retry_after or 25) + 5
                    logger.warning(f"IPRN API rate limited (429) on {endpoint}. Backing off for {retry_sec}s (Attempt {attempt+1}/4)...")
                    time.sleep(retry_sec)
                    continue
                else:
                    logger.warning(f"HTTP Error {e.code} on {endpoint}: {e}")
                    return {"success": False, "error": str(e)}
            except Exception as e:
                logger.warning(f"API request failed on {endpoint}: {e}")
                time.sleep(5)
        
        return {"success": False, "error": "Max retries reached"}

    def get_live_numbers(self) -> Dict[str, Any]:
        """Fetch ALL active allocated IPRN numbers directly from ksiiprn.com API across all pagination pages."""
        first_page = self._fetch_endpoint("numbers?page=1")
        if not isinstance(first_page, dict) or not first_page.get("success"):
            return first_page if isinstance(first_page, dict) else {"success": False, "error": "Invalid response"}

        data_list = first_page.get("data", [])
        if not isinstance(data_list, list):
            data_list = []

        all_data = list(data_list)
        pagination = first_page.get("pagination", {}) if isinstance(first_page, dict) else {}
        last_page = int(pagination.get("last_page", 1))

        # Iterate remaining pages if any
        for page in range(2, last_page + 1):
            logger.info(f"Fetching IPRN numbers page {page}/{last_page} (waiting rate limit delay)...")
            time.sleep(35)
            page_resp = self._fetch_endpoint(f"numbers?page={page}")
            if isinstance(page_resp, dict) and page_resp.get("success") and isinstance(page_resp.get("data"), list):
                all_data.extend(page_resp["data"])
            else:
                logger.warning(f"Failed to fetch page {page}: {page_resp.get('error') if isinstance(page_resp, dict) else page_resp}")

        return {
            "success": True,
            "data": all_data,
            "pagination": {
                "total": len(all_data),
                "last_page": last_page
            }
        }

    def get_live_messages(self) -> Dict[str, Any]:
        """Fetch SMS messages / CDR logs directly from ksiiprn.com API."""
        return self._fetch_endpoint("messages")

    def get_realtime_metrics(self) -> Dict[str, Any]:
        """
        Fetch active SMS traffic stats and numbers directly from IPRN Live API.
        Respects rate limit (20s delay between calls).
        """
        numbers_resp = self.get_live_numbers()
        logger.info("Fetched live numbers from IPRN API. Waiting 20s for rate limit reset before fetching live messages...")
        time.sleep(20)
        messages_resp = self.get_live_messages()
        
        return {
            "status": "success",
            "numbers_resp": numbers_resp,
            "messages_resp": messages_resp
        }


class WebsiteDataSync:
    """
    Consolidates API synchronization and saves stats to 'iprn_sync.json'
    """
    def __init__(self, client: IPRNClient, output_path: str = "iprn_sync.json"):
        self.client = client
        self.output_path = output_path

    def sync(self) -> Dict[str, Any]:
        logger.info("Initializing IPRN synchronization process...")
        try:
            # 1. Fetch live metrics from client
            raw_data = self.client.get_realtime_metrics()
            
            # Load existing cached sync data if present
            prev_data = {}
            if os.path.exists(self.output_path):
                try:
                    with open(self.output_path, 'r', encoding='utf-8') as f:
                        prev_data = json.load(f)
                except Exception:
                    pass

            now = datetime.now()
            today_str = now.strftime("%-m/%-d/%Y")

            # Parse live numbers from API
            numbers_data = raw_data.get("numbers_resp", {}).get("data", [])
            live_rented_numbers = []
            if isinstance(numbers_data, list) and len(numbers_data) > 0:
                for item in numbers_data:
                    if isinstance(item, dict):
                        num_str = str(item.get("number", ""))
                        if num_str and not num_str.startswith("+"):
                            num_str = "+" + num_str
                        range_name = item.get("range_name", "Standard Range")
                        parts = range_name.split(" - ")
                        country = parts[0].strip() if len(parts) > 0 else "Global"
                        operator = parts[1].strip() if len(parts) > 1 else "Carrier"
                        rate_val = float(item.get("a2p_rate") or 0.0)
                        limit_val = int(item.get("portal_limit_a2p") or 10000)

                        live_rented_numbers.append({
                            "id": f"NUM-IPRN-{num_str.replace('+', '')}",
                            "rangeName": range_name,
                            "number": num_str,
                            "rate": f"{rate_val:.4f} USD",
                            "term": range_name,
                            "country": country,
                            "operator": operator,
                            "status": "Active",
                            "lastMessage": item.get("last_message_at") or "-",
                            "portalLimit": f"{limit_val:,}",
                            "sidRange": "IPRN-Direct",
                            "multiLimit": "No Limit",
                            "sidDidLimit": "Unlimited",
                            "cost": f"{rate_val:.4f} USD"
                        })

            # Merge with previous cached numbers so the full 110 numbers are never lost
            existing_rented = prev_data.get("rented_numbers", [])
            if not live_rented_numbers:
                live_rented_numbers = existing_rented
            elif len(live_rented_numbers) < len(existing_rented):
                # Update existing numbers with new details while keeping all 110 numbers
                live_map = {n["number"]: n for n in live_rented_numbers}
                merged = []
                for old_n in existing_rented:
                    num_key = old_n.get("number")
                    if num_key in live_map:
                        merged.append({**old_n, **live_map[num_key]})
                    else:
                        merged.append(old_n)
                live_rented_numbers = merged
            else:
                live_nums_set = {n["number"] for n in live_rented_numbers}
                user_added = [n for n in existing_rented if isinstance(n, dict) and n.get("number") and n.get("number") not in live_nums_set]
                live_rented_numbers = user_added + live_rented_numbers

            # Parse live messages from API
            msgs_data = raw_data.get("messages_resp", {}).get("data", [])
            live_sms_logs = []
            if isinstance(msgs_data, list) and len(msgs_data) > 0:
                for item in msgs_data:
                    if isinstance(item, dict):
                        live_sms_logs.append({
                            "id": str(item.get("id", f"MSG-LIVE-{int(time.time() * 1000)}")),
                            "number": str(item.get("number", "")),
                            "termination": str(item.get("range_name") or item.get("termination") or ""),
                            "sid": str(item.get("sid", "")),
                            "status": str(item.get("status", "DELIVERED")).upper(),
                            "text": str(item.get("text") or item.get("content") or ""),
                            "otp": str(item.get("otp", "")),
                            "timestamp": str(item.get("timestamp") or item.get("created_at") or now.isoformat()),
                            "cost": f"{float(item.get('cost') or item.get('a2p_rate') or 0.0):.4f} USD",
                            "sender": str(item.get("sender", "IPRN-LIVE"))
                        })

            if not live_sms_logs and prev_data.get("active_sms_logs"):
                live_sms_logs = prev_data.get("active_sms_logs", [])

            base_total = len(live_sms_logs)
            base_delivered = sum(1 for m in live_sms_logs if m.get("status") == "DELIVERED")
            base_failed = sum(1 for m in live_sms_logs if m.get("status") == "FAILED")
            today_count = base_total
            delivery_rate = round((base_delivered / base_total) * 100, 1) if base_total > 0 else 0.0

            payload = {
                "last_updated": now.isoformat(),
                "metrics": {
                    "messages": base_total,
                    "delivered": base_delivered,
                    "failed": base_failed,
                    "todayCount": today_count,
                    "deliveryRate": delivery_rate,
                    "todayDate": today_str
                },
                "realtime_counters": {
                    "totalMessages": today_count,
                    "delivered": base_delivered,
                    "failed": base_failed,
                    "charged": today_count
                },
                "chart_data": [
                    { "date": (now - timedelta(days=6)).strftime("%b %-d"), "total": 0, "delivered": 0, "failed": 0 },
                    { "date": (now - timedelta(days=5)).strftime("%b %-d"), "total": 0, "delivered": 0, "failed": 0 },
                    { "date": (now - timedelta(days=4)).strftime("%b %-d"), "total": 0, "delivered": 0, "failed": 0 },
                    { "date": (now - timedelta(days=3)).strftime("%b %-d"), "total": 0, "delivered": 0, "failed": 0 },
                    { "date": (now - timedelta(days=2)).strftime("%b %-d"), "total": 0, "delivered": 0, "failed": 0 },
                    { "date": (now - timedelta(days=1)).strftime("%b %-d"), "total": 0, "delivered": 0, "failed": 0 },
                    { "date": now.strftime("%b %-d"), "total": today_count, "delivered": base_delivered, "failed": base_failed }
                ],
                "active_sms_logs": live_sms_logs,
                "rented_numbers": live_rented_numbers
            }
            
            # 3. Write to the target JSON structure safely
            temp_path = f"{self.output_path}.tmp"
            with open(temp_path, 'w', encoding='utf-8') as f:
                json.dump(payload, f, indent=2)
            
            # Atomic rename to prevent corrupt reading during task write
            os.replace(temp_path, self.output_path)
            
            logger.info(f"Synchronization successful! Saved metrics data to: {self.output_path}")
            return payload
            
        except Exception as e:
            logger.error(f"Synchronization task failed: {e}")
            raise


LOCK_FILE = "/tmp/iprn_sync.lock"

def acquire_lock():
    if os.path.exists(LOCK_FILE):
        try:
            mtime = os.path.getmtime(LOCK_FILE)
            if time.time() - mtime > 120:
                os.remove(LOCK_FILE)
            else:
                logger.info("Another sync process is already running. Skipping duplicate run.")
                sys.exit(0)
        except Exception:
            pass
    try:
        with open(LOCK_FILE, "w") as f:
            f.write(str(os.getpid()))
    except Exception:
        pass

def release_lock():
    try:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
    except Exception:
        pass


if __name__ == "__main__":
    # Allows direct execution as a test/cron target
    acquire_lock()
    try:
        client = IPRNClient()
        sync_manager = WebsiteDataSync(client)
        sync_manager.sync()
    finally:
        release_lock()
