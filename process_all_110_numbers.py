import json
import time

with open('all_iprn_numbers_raw.json') as f:
    raw_numbers = json.load(f)

print(f"Loaded {len(raw_numbers)} raw numbers from API.")

formatted_numbers = []
for idx, item in enumerate(raw_numbers):
    raw_num = str(item.get('number', '')).strip()
    num_str = f"+{raw_num}" if not raw_num.startswith('+') else raw_num
    range_name = item.get('range_name', 'Azerbaijan - Bakcell 3')
    
    parts = range_name.split(' - ')
    if len(parts) > 1:
        country = parts[0].strip()
        operator = parts[1].strip()
    else:
        country = 'Cambodia' if 'Cambodia' in range_name else 'Azerbaijan'
        operator = range_name
        
    rate_val = float(item.get('a2p_rate') or 0.0096)
    limit_val = int(item.get('portal_limit_a2p') or 10000)
    
    formatted_numbers.append({
        "id": f"NUM-IPRN-{raw_num}",
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

print(f"Formatted {len(formatted_numbers)} numbers.")

# Update iprn_sync.json
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

print("Updated iprn_sync.json with all 110 numbers!")
