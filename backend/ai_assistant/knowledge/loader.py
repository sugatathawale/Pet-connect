"""Load Pet Connect knowledge bases into Agno Knowledge collections (Gemini embedder)."""

from __future__ import annotations

import os
from pathlib import Path

from agno.knowledge.embedder.google import GeminiEmbedder
from agno.knowledge.knowledge import Knowledge
from agno.vectordb.chroma import ChromaDb

CONTENT_ROOT = Path(__file__).resolve().parent / "content"
VECTOR_PATH = Path(__file__).resolve().parents[1] / "tmp" / "chromadb"

# Separate collections so breed queries don't drown out app FAQ (and vice versa).
KB_SOURCES: dict[str, list[Path]] = {
    "greetings": [CONTENT_ROOT / "greetings.md"],
    "general_faq": [
        CONTENT_ROOT / "general_faq.md",
        CONTENT_ROOT / "app_features.md",
    ],
    "dogs": [CONTENT_ROOT / "dogs" / "breeds.md"],
    "cats": [CONTENT_ROOT / "cats" / "breeds.md"],
}


def _embedder() -> GeminiEmbedder:
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    return GeminiEmbedder(api_key=api_key)


def _chroma(collection: str) -> ChromaDb:
    return ChromaDb(
        collection=collection,
        path=str(VECTOR_PATH),
        persistent_client=True,
        embedder=_embedder(),
    )


def combined_knowledge(*, skip_if_exists: bool = True) -> Knowledge:
    """
    Single searchable Knowledge for the assistant agent.

    Domains stay as separate files on disk; vectors share one collection so
    Agentic RAG can pull greetings, FAQ, and breed answers in one search.
    """
    VECTOR_PATH.mkdir(parents=True, exist_ok=True)
    knowledge = Knowledge(
        name="petconnect_all",
        vector_db=_chroma("petconnect_all_gemini"),
    )

    for name, paths in KB_SOURCES.items():
        for path in paths:
            knowledge.insert(
                name=f"{name}/{path.stem}",
                path=str(path),
                skip_if_exists=skip_if_exists,
                metadata={
                    "domain": name,
                    "species": name if name in ("dogs", "cats") else "app",
                },
            )

    return knowledge
