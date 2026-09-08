#!/usr/bin/env python3
import urllib.request
import json
import time
import os

API_KEY = "sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z"
BASE_URL = "https://ksiiprn.com/api/v1/iprn"

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Accept': 'application/json',
    'User-Agent': 'IPRN-Sync/1.0'
}

def fetch_page(page):
    url = f"{BASE_URL}/numbers?page={page}"
    for attempt in range(6):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                items = data.get('data', [])
                pagination = data.get('pagination', {})
                print(f"Page {page} fetched successfully! Got {len(items)} numbers. Total: {pagination.get('total')}, Last page: {pagination.get('last_page')}")
                return items, pagination
        except urllib.error.HTTPError as e:
            if e.code == 429:
                err_body = e.read().decode('utf-8', errors='ignore')
                print(f"Page {page} got 429 Rate Limit (Attempt {attempt+1}/6): {err_body}")
                retry_after = 35
                try:
                    err_json = json.loads(err_body)
                    msg = err_json.get('error', {}).get('message', '')
                    import re
                    m = re.search(r'Retry after (\d+) seconds', msg)
                    if m:
                        retry_after = int(m.group(1)) + 3
                except Exception:
                    pass
                print(f"Sleeping {retry_after}s before retry...")
                time.sleep(retry_after)
            else:
                print(f"HTTP Error {e.code} on page {page}: {e}")
                return [], {}
        except Exception as e:
            print(f"Error on page {page}: {e}")
            time.sleep(5)
    return [], {}

def main():
    print("Starting full IPRN numbers fetch...")
    all_numbers = []
    
    # Fetch page 1
    items, pagination = fetch_page(1)
    all_numbers.extend(items)
    last_page = pagination.get('last_page', 6)
    
    for p in range(2, last_page + 1):
        print(f"Waiting 35s before fetching page {p}...")
        time.sleep(35)
        p_items, _ = fetch_page(p)
        all_numbers.extend(p_items)
    
    print(f"Done! Total fetched: {len(all_numbers)} numbers.")
    with open('all_iprn_numbers_raw.json', 'w') as f:
        json.dump(all_numbers, f, indent=2)
    print("Saved to all_iprn_numbers_raw.json")

if __name__ == '__main__':
    main()
