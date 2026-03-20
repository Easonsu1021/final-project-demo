from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

#gemini
#from services.llm_agent import process_chat_message

#local ollama
from services.ollama_agent import process_chat_message

router = APIRouter(
    prefix="/orchestrator",
    tags=["orchestrator"]
)

class ChatMessage(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    actions: List[Dict[str, Any]] = []

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # 使用相對路徑進行調試記錄，避免硬編碼個人目錄導致 500 錯誤
        with open("debug_request.txt", "w", encoding="utf-8") as f:
            f.write(f"RAW REQUEST: {request.json()}\n")
            
        # Process the chat message via the LLM Service
        response_msg, actions = await process_chat_message(request.messages, request.context)
        return ChatResponse(message=response_msg, actions=actions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
