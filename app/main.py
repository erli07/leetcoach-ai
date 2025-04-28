from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.agent import get_agent_response
from typing import List

app = FastAPI()

# ✅ Add this block
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"] for stricter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InterviewInput(BaseModel):
    user_message: str
    session_id: str

@app.post("/interview")
async def interview(input: InterviewInput):
    reply = get_agent_response(input.session_id, input.user_message)
    print(f"[Interview Log] session_id={input.session_id}, user_message='{input.user_message}', reply='{reply}'")
    return {"reply": reply}

# Define message and session record models
class Message(BaseModel):
    role: str
    content: str

class SessionRecord(BaseModel):
    id: str
    topic: str
    difficulty: str
    startTime: str
    endTime: str
    duration: str
    messages: List[Message]

# In-memory storage for now
session_records: List[SessionRecord] = []

@app.post("/save_session")
async def save_session(session: SessionRecord):
    session_records.append(session)
    return {"status": "ok"}

@app.get("/get_sessions")
async def get_sessions():
    return session_records