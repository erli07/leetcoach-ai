import os
from dotenv import load_dotenv

load_dotenv()

from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

session_agents = {}

def get_agent_response(session_id: str, user_input: str) -> str:
    if session_id not in session_agents:
        session_agents[session_id] = ConversationChain(
            llm=ChatOpenAI(
                temperature=0,
                openai_api_key=os.getenv("OPENAI_API_KEY")
            ),
            memory=ConversationBufferMemory()
        )
    return session_agents[session_id].run(user_input)