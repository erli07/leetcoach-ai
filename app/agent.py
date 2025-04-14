import os
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from .questions_loader import load_question_db
from app.session_store import session_agents, last_question_map

# Load environment variables from .env
load_dotenv()

# Initialize OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Load vector store from pre-embedded question dataset
question_db = load_question_db()

def get_agent_response(session_id: str, user_input: str) -> str:
    user_input = user_input.strip()

    # Handle command prefixes
    if user_input.startswith("#"):
        command_parts = user_input.split(maxsplit=1)
        command = command_parts[0].lower()
        arg = command_parts[1] if len(command_parts) > 1 else ""

        if command == "#leetcode":
            return get_question(arg or "medium array", session_id)

        elif command == "#feedback":
            return generate_feedback(session_id)

        elif command == "#hint":
            return generate_hint_with_llm(session_id)

        else:
            return f"Unknown command: {command}"

    # Default: run through conversational agent
    if session_id not in session_agents:
        session_agents[session_id] = ConversationChain(
            llm=ChatOpenAI(temperature=0, openai_api_key=OPENAI_API_KEY),
            memory=ConversationBufferMemory()
        )

    return session_agents[session_id].run(user_input)


def get_question(query: str, session_id: str) -> str:
    results = question_db.similarity_search(query, k=1)
    if not results:
        return "Sorry, I couldn't find a matching question."
    
    doc = results[0]
    meta = doc.metadata
    question_text = f"{meta['title']} ({meta['difficulty']} - {meta['topic']}):\n{doc.page_content}"
    last_question_map[session_id] = question_text  # 💾 Store for follow-up
    return question_text

def generate_hint_with_llm(session_id: str) -> str:
    if session_id not in last_question_map:
        return "No question in progress. Please start with #leetcode first."

    question_prompt = last_question_map[session_id]

    prompt = f"""
    You are a friendly technical interviewer. Here's a coding problem:

    {question_prompt}

    Without giving away the solution, generate a helpful hint that nudges the candidate in the right direction. Keep it 1–2 sentences. Don't use the exact variable names from the prompt.
    """

    llm = ChatOpenAI(temperature=0.7, openai_api_key=os.getenv("OPENAI_API_KEY"))
    return llm.invoke(prompt).content.strip()

def generate_feedback(session_id: str) -> str:
    print(f"Available sessions: {list(session_agents.keys())}")

    if session_id not in session_agents:
        return "No session found!!!! Please start an interview first."

    memory = session_agents[session_id].memory
    chat_history = memory.buffer  # This contains the full conversation as a string

    prompt = PromptTemplate.from_template("""
    You are a technical interviewer. Here's the interview transcript:
    
    {transcript}
    
    Give structured feedback to the candidate:
    - Communication
    - Problem-solving ability
    - Code quality (if applicable)
    - Areas for improvement
    """)

    llm = ChatOpenAI(temperature=0, openai_api_key=os.getenv("OPENAI_API_KEY"))
    return llm.invoke(prompt.format(transcript=chat_history)).content
