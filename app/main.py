from fastapi import FastAPI, Request
from pydantic import BaseModel
from .agent import get_agent_response

app = FastAPI()

class InterviewInput(BaseModel):
    user_message: str
    session_id: str

@app.post("/interview")
async def interview(input: InterviewInput):
    reply = get_agent_response(input.session_id, input.user_message)
    return {"reply": reply}

@app.get("/")
def read_root():
    return {"message": "LeetCoach AI is running!"}