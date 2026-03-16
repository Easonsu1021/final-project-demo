# -*- coding: utf-8 -*-
import urllib.request, json
prompt = "用戶點擊了執行流程。請分析目前的基板設計 (55x55mm, 銅含量38%)，主動呼叫 predict_warpage 進行預測。若超過標準，請主動呼叫 optimize_design_parameters 進行最佳化，【並且必須將剛剛 predict_warpage 算出來的 warpage_um 數值，直接當作 target_warpage_um 參數傳遞進去給 optimize_design_parameters】。最後向用戶回報總結。"
data = json.dumps({'messages': [{'role': 'user', 'content': prompt}]}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8003/orchestrator/chat', data=data, headers={'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    res_data = json.loads(res.read())
    actions = res_data.get('actions', [])
    for a in actions:
        if a.get('node_type') == 'substrate-ai-param-design':
            print(f"PIPED TARGET: {a.get('parameters', {}).get('target_warpage_um')}")
            break
    else:
        print("No optimize action found!")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
