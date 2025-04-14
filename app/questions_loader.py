import json
import os
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema import Document
from dotenv import load_dotenv

load_dotenv()

def load_question_db():
    with open("data/questions.json", "r") as f:
        raw = json.load(f)

    docs = [
        Document(
            page_content=q["prompt"],
            metadata={"title": q["title"], "difficulty": q["difficulty"], "topic": q["topic"]}
        )
        for q in raw
    ]

    embedding_model = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
    db = FAISS.from_documents(docs, embedding_model)
    return db
