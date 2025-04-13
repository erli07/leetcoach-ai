from fastapi import FastAPI, Request
from pydantic import BaseModel
from .agent import get_agent_response
from .feedback import generate_feedback

app = FastAPI()

class InterviewInput(BaseModel):
    user_message: str
    session_id: str

@app.post("/interview")
async def interview(input: InterviewInput):
    reply = get_agent_response(input.session_id, input.user_message)
    return {"reply": reply}

@app.post("/feedback")
async def feedback(input: InterviewInput):
    summary = generate_feedback(input.session_id)
    return {"summary": summary}

@app.get("/")
def read_root():
    return {"message": "LeetCoach AI is running!"}