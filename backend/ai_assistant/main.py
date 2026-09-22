"""FastAPI entrypoint for the Pet Connect Agno assistant."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Allow `uvicorn main:app` from this directory.
import sys

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")

from agent.assistant import ask  # noqa: E402
from agent.intent import scrape_intent  # noqa: E402

app = FastAPI(title="Pet Connect AI Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    user_id: str | None = None


class IntentRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "gemini_configured": bool(
            os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        ),
        "model": os.getenv("PETCONNECT_AI_MODEL", "gemini-2.0-flash"),
    }


@app.post("/intent")
def intent_only(body: IntentRequest) -> dict:
    match = scrape_intent(body.message)
    return {
        "intent": match.intent.value,
        "domain": match.domain,
        "confidence": match.confidence,
        "cleaned_query": match.cleaned_query,
        "matched_terms": match.matched_terms,
    }


@app.post("/chat")
def chat(body: ChatRequest) -> dict:
    return ask(body.message, user_id=body.user_id)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8787")),
        reload=True,
    )
