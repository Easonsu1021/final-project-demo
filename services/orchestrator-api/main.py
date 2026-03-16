from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables (Force override to pick up new user API keys)
load_dotenv(override=True)

from routers import chat

app = FastAPI(
    title="Orchestrator API", 
    description="AI Orchestrator with tool execution capabilities for CoWoS Workflow"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed (e.g. frontend URL)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "orchestrator-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
