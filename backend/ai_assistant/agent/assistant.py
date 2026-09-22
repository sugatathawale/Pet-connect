"""Pet Connect Agno assistant — Gemini + knowledge-grounded FAQ agent."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from agno.agent import Agent
from agno.models.google import Gemini
from agno.run import RunStatus

from agent.guardrails import SCOPE_REFUSAL, build_pre_hooks
from agent.intent import Intent, IntentMatch, scrape_intent
from knowledge.loader import combined_knowledge

INSTRUCTIONS = [
    "You are the Pet Connect in-app assistant named Paw.",
    "Answer ONLY using the knowledge base and Pet Connect product context.",
    "Topics allowed: greetings, app how-to, matching, listings, privacy, dog breeds, cat breeds, general companion-pet care at a high level.",
    "If the knowledge base does not contain the answer, say you are not sure and suggest Support or a veterinarian for medical advice.",
    "Never invent veterinary diagnoses, medications, or dosages.",
    "Never answer politics, finance, hacking, homework, cooking, weather, sports, or coding.",
    "Keep answers concise (2–6 short sentences). Be warm and clear.",
    "When the user greets you, greet back and briefly offer help.",
]


def _gemini_key() -> str | None:
    return os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")


@lru_cache(maxsize=1)
def get_agent() -> Agent:
    api_key = _gemini_key()
    model_id = os.getenv("PETCONNECT_AI_MODEL", "gemini-2.0-flash")

    knowledge = combined_knowledge(skip_if_exists=True)

    return Agent(
        name="Pet Connect Assistant",
        model=Gemini(id=model_id, api_key=api_key),
        knowledge=knowledge,
        search_knowledge=True,
        pre_hooks=build_pre_hooks(),
        instructions=INSTRUCTIONS,
        markdown=False,
    )


def ask(message: str, *, user_id: str | None = None) -> dict[str, Any]:
    """
    Run intent scraping + Agno agent (Gemini).

    Returns a JSON-serialisable dict for the mobile client.
    """
    intent: IntentMatch = scrape_intent(message)

    if intent.intent == Intent.OUT_OF_SCOPE:
        return {
            "reply": SCOPE_REFUSAL,
            "blocked": True,
            "intent": intent.intent.value,
            "domain": intent.domain,
            "confidence": intent.confidence,
            "matched_terms": intent.matched_terms,
            "source": "guardrail",
        }

    if not _gemini_key():
        return {
            "reply": (
                "AI backend is running but GOOGLE_API_KEY is not set. "
                "The mobile app can still answer from its local knowledge base."
            ),
            "blocked": False,
            "intent": intent.intent.value,
            "domain": intent.domain,
            "confidence": intent.confidence,
            "matched_terms": intent.matched_terms,
            "source": "config",
        }

    steered = (
        f"[intent={intent.intent.value} domain={intent.domain} "
        f"terms={','.join(intent.matched_terms)}]\n"
        f"User: {intent.cleaned_query or message}"
    )

    agent = get_agent()
    try:
        result = agent.run(steered, user_id=user_id)
    except Exception as exc:  # noqa: BLE001 — surface cleanly to API
        return {
            "reply": "Something went wrong answering that. Please try again.",
            "blocked": False,
            "intent": intent.intent.value,
            "domain": intent.domain,
            "confidence": intent.confidence,
            "matched_terms": intent.matched_terms,
            "source": "error",
            "error": str(exc),
        }

    blocked = getattr(result, "status", None) == RunStatus.error
    content = getattr(result, "content", None) or SCOPE_REFUSAL

    if blocked:
        return {
            "reply": str(content) if content else SCOPE_REFUSAL,
            "blocked": True,
            "intent": intent.intent.value,
            "domain": intent.domain,
            "confidence": intent.confidence,
            "matched_terms": intent.matched_terms,
            "source": "guardrail",
        }

    return {
        "reply": str(content).strip(),
        "blocked": False,
        "intent": intent.intent.value,
        "domain": intent.domain,
        "confidence": intent.confidence,
        "matched_terms": intent.matched_terms,
        "source": "agno",
    }
