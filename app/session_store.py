# app/session_store.py

from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

# Shared session state (single source of truth)
session_agents = {}
last_question_map = {}
