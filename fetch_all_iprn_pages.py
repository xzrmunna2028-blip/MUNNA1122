#!/usr/bin/env python3
import urllib.request
import urllib.error
import json
import time
import re
import os

API_KEY = "sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z"
BASE_URL = "https://ksiiprn.com/api/v1/iprn"

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Accept': 'application/json',
    'User-Agent': 'IPRN-Website-Sync/1.0'
}

def fetch_single_page(page_num: int):
    url = f"{BASE_URL}/numbers?page={page_num}"
    print(f"\n[PAGE {page_num}] Fetching from {url}...")
    
    for attempt in range(5):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                items = data.get('data', [])
                pagination = data.get('pagination', {})
                print(f"[PAGE {page_num}] Success! Got {len(items)} numbers. (Total: {pagination.get('total')}, Last page: {pagination.get('last_page')})")
                return items, pagination
        except urllib.error.HTTPError as e:
            if e.code == 429:
                err_body = e.read().decode('utf-8', errors='ignore')
                retry_after = 55
                m = re.search(r'Retry after (\d+) seconds', err_body)
                if m:
                    retry_after = int(m.group(1)) + 5
                print(f"[PAGE {page_num}] 429 Rate limited. Waiting {retry_after}s (Attempt {attempt+1}/5)...")
                time.sleep(retry_after)
            else:
                print(f"[PAGE {page_num}] HTTP {e.code} error: {e}")
                return [], {}
        except Exception as e:
            print(f"[PAGE {page_num}] Exception: {e}")
            time.sleep(10)
            
    return [], {}

def main():
    print("=== Starting IPRN API 110 Numbers Downloader ===")
    print("Waiting 50s initially to ensure clean rate limit window...")
    time.sleep(50)
    
    all_raw_numbers = []
    
    # Page 1
    items, pagination = fetch_single_page(1)
    if items:
        all_raw_numbers.extend(items)
        with open('page_1.json', 'w') as f:
            json.dump(items, f, indent=2)
            
    last_page = int(pagination.get('last_page', 6))
    print(f"Total pages to fetch: {last_page}")
    
    for p in range(2, last_page + 1):
        print(f"\nSleeping 55s before fetching page {p} to respect API rate limit...")
        time.sleep(55)
        items, _ = fetch_single_page(p)
        if items:
            all_raw_numbers.extend(items)
            with open(f'page_{p}.json', 'w') as f:
                json.dump(items, f, indent=2)
                
    print(f"\n=== FETCH COMPLETE! Total downloaded numbers: {len(all_raw_numbers)} ===")
    with open('all_raw_110_numbers.json', 'w') as f:
        json.dump(all_raw_numbers, f, indent=2)
        
    # Format into standard structure
    formatted_numbers = []
    for item in all_raw_numbers:
        raw_num = str(item.get('number', '')).strip()
        num_str = f"+{raw_num}" if not raw_num.startswith('+') else raw_num
        range_name = item.get('range_name', 'Standard Range')
        
        parts = range_name.split(' - ')
        country = parts[0].strip() if len(parts) > 0 else 'Global'
        operator = parts[1].strip() if len(parts) > 1 else 'Carrier'
        rate_val = float(item.get('a2p_rate') or 0.0096)
        limit_val = int(item.get('portal_limit_a2p') or 10000)
        
        formatted_numbers.append({
            "id": f"NUM-IPRN-{raw_num.replace('+', '')}",
            "number": num_str,
            "range": range_name,
            "rangeName": range_name,
            "operator": operator,
            "country": country,
            "rate": f"{rate_val:.4f} USD",
            "cost": f"{rate_val:.4f} USD",
            "term": "1/1",
            "status": "ACTIVE",
            "lastMessage": item.get('last_message_at') or "None",
            "portalLimit": f"{limit_val:,}",
            "sidRange": "IPRN-Direct",
            "multiLimit": "No Limit",
            "sidDidLimit": "Unlimited",
            "assignedAt": item.get('assigned_at')
        })
        
    # Write to iprn_sync.json
    now = time.strftime('%Y-%m-%dT%H:%M:%S')
    sync_data = {
        "last_updated": now,
        "metrics": {
            "messages": 0,
            "delivered": 0,
            "failed": 0,
            "todayCount": 0,
            "deliveryRate": 0.0,
            "todayDate": time.strftime('%-m/%-d/%Y')
        },
        "realtime_counters": {
            "totalMessages": 0,
            "delivered": 0,
            "failed": 0,
            "charged": 0
        },
        "chart_data": [
            { "date": "Sep 2", "total": 0, "delivered": 0, "failed": 0 },
            { "date": "Sep 3", "total": 0, "delivered": 0, "failed": 0 },
            { "date": "Sep 4", "total": 0, "delivered": 0, "failed": 0 },
            { "date": "Sep 5", "total": 0, "delivered": 0, "failed": 0 },
            { "date": "Sep 6", "total": 0, "delivered": 0, "failed": 0 },
            { "date": "Sep 7", "total": 0, "delivered": 0, "failed": 0 },
            { "date": "Sep 8", "total": 0, "delivered": 0, "failed": 0 }
        ],
        "active_sms_logs": [],
        "rented_numbers": formatted_numbers
    }
    
    with open('iprn_sync.json', 'w', encoding='utf-8') as f:
        json.dump(sync_data, f, indent=2)
    print(f"Successfully saved {len(formatted_numbers)} numbers into iprn_sync.json!")

if __name__ == '__main__':
    main()
