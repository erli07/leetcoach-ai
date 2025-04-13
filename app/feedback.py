from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI

def generate_feedback(session_id: str) -> str:
    # Dummy transcript, replace with real one from session memory
    transcript = "User solved Two Sum by brute force, explained time complexity..."

    prompt = PromptTemplate.from_template("""
    You are a technical interviewer. Here's the interview transcript:
    {transcript}

    Give structured feedback:
    - Communication
    - Problem-solving
    - Code quality
    - Suggestion for improvement
    """)
    
    return ChatOpenAI().invoke(prompt.format(transcript=transcript)).content
