from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.agent import get_agent_response

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
    
    # ✅ Add this log
    print(f"[Interview Log] session_id={input.session_id}, user_message='{input.user_message}', reply='{reply}'")

    return {"reply": reply}

@app.get("/")
def read_root():
    return {"message": "LeetCoach AI is running!"}