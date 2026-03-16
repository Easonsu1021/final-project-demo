# -*- coding: utf-8 -*-
import httpx
import asyncio
import json

async def test_orchestrator():
    print("? Starting End-to-End Orchestrator Test")
    
    # Target the orchestrator API
    url = "http://localhost:8003/orchestrator/chat"
    
    # 1. Test Generate Flow Command
    print("\n--- Test 1: Generate Flow ---")
    payload1 = {
        "messages": [
            {"role": "user", "content": "我要建立一個完整的 CoWoS 設計流程"}
        ]
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("Sending request for Flow Generation...")
        res1 = await client.post(url, json=payload1)
        if res1.status_code == 200:
            data = res1.json()
            print("? Response Received!")
            print(f"Message: {data['message']['content']}")
            print(f"Actions returned: {len(data['actions'])}")
            for a in data["actions"]:
                print(f"  - {a.get('action')}: {a.get('message')}")
        else:
            print(f"? Failed: {res1.status_code} - {res1.text}")

    # 2. Test Execute Flow Command (Should trigger back-end API calls)
    print("\n--- Test 2: Execute Flow / Predict Warpage ---")
    payload2 = {
        "messages": [
            {"role": "user", "content": "好的，請幫我執行流程，預測當前基板設計 (55mm, 銅38%) 的翹曲"}
        ]
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("Sending request for Execution (This will trigger predict_warpage)...")
        res2 = await client.post(url, json=payload2)
        if res2.status_code == 200:
            data = res2.json()
            print("? Response Received!")
            print(f"Message: {data['message']['content']}")
            print(f"Actions returned: {len(data['actions'])}")
            for a in data["actions"]:
                print(f"  - Action Type: {a.get('action')}")
                if "result" in a:
                    print(f"    - Has Result: Yes! (Keys: {list(a['result'].keys())})")
                    if "warpage_um" in a["result"]:
                        print(f"    - Warpage UM: {a['result']['warpage_um']}")
        else:
            print(f"? Failed: {res2.status_code} - {res2.text}")


if __name__ == "__main__":
    asyncio.run(test_orchestrator())
