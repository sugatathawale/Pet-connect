"""
Intent scraping for free-form user messages.

Normalises typos/casing, scores against known intents, and routes to the
right knowledge domain before the Agno agent answers.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum


class Intent(str, Enum):
    GREETING = "greeting"
    FAREWELL = "farewell"
    THANKS = "thanks"
    HELP = "help"
    APP_FAQ = "app_faq"
    DOG_BREED = "dog_breed"
    CAT_BREED = "cat_breed"
    OUT_OF_SCOPE = "out_of_scope"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class IntentMatch:
    intent: Intent
    confidence: float
    domain: str
    cleaned_query: str
    matched_terms: list[str]


# Phrase → intent. Longer / more specific phrases win via length weighting.
_INTENT_PHRASES: list[tuple[Intent, tuple[str, ...]]] = [
    (
        Intent.GREETING,
        (
            "good morning",
            "good afternoon",
            "good evening",
            "namaste",
            "hello",
            "hey",
            "hi",
            "yo",
            "how are you",
            "how's it going",
        ),
    ),
    (Intent.FAREWELL, ("goodbye", "good bye", "see you", "talk later", "bye")),
    (Intent.THANKS, ("thank you", "thanks", "thx", "appreciate")),
    (
        Intent.HELP,
        (
            "what can you do",
            "how can you help",
            "what do you know",
            "help me",
            "help",
        ),
    ),
    (
        Intent.APP_FAQ,
        (
            "pet connect",
            "compatibility",
            "matching",
            "mutual interest",
            "breeding availability",
            "availability window",
            "swipe",
            "discover",
            "nearby",
            "listing",
            "adopt",
            "sell",
            "chat",
            "notification",
            "filter",
            "vaccination",
            "spayed",
            "neutered",
            "location",
            "privacy",
            "profile",
            "sign up",
            "login",
            "support",
            "how does",
            "how do i",
            "what is",
        ),
    ),
    (
        Intent.DOG_BREED,
        (
            "labrador",
            "golden retriever",
            "german shepherd",
            "beagle",
            "pug",
            "indie dog",
            "pariah",
            "desi dog",
            "pomeranian",
            "husky",
            "bulldog",
            "rottweiler",
            "shih tzu",
            "dachshund",
            "boxer",
            "cocker spaniel",
            "doberman",
            "dog breed",
            "dogs",
            "puppy",
            "dog",
        ),
    ),
    (
        Intent.CAT_BREED,
        (
            "persian",
            "siamese",
            "maine coon",
            "british shorthair",
            "indie cat",
            "desi cat",
            "bengal",
            "ragdoll",
            "sphynx",
            "scottish fold",
            "american shorthair",
            "cat breed",
            "kitten",
            "cats",
            "cat",
        ),
    ),
]

# Hard off-topic signals — blocked by guardrails + intent layer.
_OUT_OF_SCOPE_PATTERNS: tuple[str, ...] = (
    r"\b(stock|crypto|bitcoin|nft)\b",
    r"\b(politics|election|vote for)\b",
    r"\b(hack|exploit|malware|phishing)\b",
    r"\b(bomb|weapon|explosive)\b",
    r"\b(medical diagnos|prescribe|dosage)\b",
    r"\b(write (my |an )?essay|homework|exam cheat)\b",
    r"\b(recipe for|cook|weather in|sports score)\b",
    r"\b(code (this|a)|python script|javascript)\b",
)


def normalize_query(text: str) -> str:
    """Scrape/normalise user typing: lower, strip noise, collapse whitespace."""
    cleaned = text.lower().strip()
    cleaned = cleaned.replace("’", "'")
    cleaned = re.sub(r"[^\w\s'#./+-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    # Light typo helpers for common greetings / pets
    replacements = {
        "helo": "hello",
        "hallo": "hello",
        "hii": "hi",
        "hiii": "hi",
        "thanx": "thanks",
        "thnx": "thanks",
        "doggo": "dog",
        "kitty": "cat",
        "kittie": "cat",
        "labradorr": "labrador",
        "retriver": "retriever",
        "shepard": "shepherd",
        "sheperd": "shepherd",
    }
    tokens = [replacements.get(tok, tok) for tok in cleaned.split()]
    return " ".join(tokens)


def _domain_for(intent: Intent) -> str:
    return {
        Intent.GREETING: "greetings",
        Intent.FAREWELL: "greetings",
        Intent.THANKS: "greetings",
        Intent.HELP: "greetings",
        Intent.APP_FAQ: "general_faq",
        Intent.DOG_BREED: "dogs",
        Intent.CAT_BREED: "cats",
        Intent.OUT_OF_SCOPE: "none",
        Intent.UNKNOWN: "general_faq",
    }[intent]


def scrape_intent(raw: str) -> IntentMatch:
    """Match user text to the best intent + knowledge domain."""
    cleaned = normalize_query(raw)

    if not cleaned:
        return IntentMatch(Intent.UNKNOWN, 0.0, "general_faq", cleaned, [])

    for pattern in _OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, cleaned):
            return IntentMatch(
                Intent.OUT_OF_SCOPE,
                0.95,
                "none",
                cleaned,
                [pattern],
            )

    best: Intent | None = None
    best_score = 0.0
    matched: list[str] = []

    for intent, phrases in _INTENT_PHRASES:
        hits = [p for p in phrases if p in cleaned]
        if not hits:
            continue
        # Prefer longer phrase hits (more specific).
        score = sum(len(h) for h in hits) + 0.15 * len(hits)
        if score > best_score:
            best_score = score
            best = intent
            matched = hits

    if best is None:
        # Soft pet keywords without breed names → app FAQ
        if any(w in cleaned for w in ("pet", "breed", "owner", "match", "animal")):
            return IntentMatch(Intent.APP_FAQ, 0.4, "general_faq", cleaned, ["pet"])
        return IntentMatch(Intent.UNKNOWN, 0.2, "general_faq", cleaned, [])

    # Normalise confidence into 0..1 for API consumers.
    confidence = min(0.99, 0.35 + best_score / 40)
    return IntentMatch(best, confidence, _domain_for(best), cleaned, matched)
