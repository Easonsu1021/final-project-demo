from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from services.llm_agent import process_chat_message

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
        with open("C:/Users/eason/OneDrive/桌面/final-project-demo-main/debug_request.txt", "w", encoding="utf-8") as f:
            f.write(f"RAW REQUEST: {request.json()}\n")
            
        # Process the chat message via the LLM Service
        response_msg, actions = await process_chat_message(request.messages, request.context)
        return ChatResponse(message=response_msg, actions=actions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
