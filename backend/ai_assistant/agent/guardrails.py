"""
Guardrails for the Pet Connect assistant.

- PromptInjectionGuardrail: blocks jailbreak / instruction override attempts
- ScopeGuardrail: blocks out-of-scope topics unrelated to pets / Pet Connect
"""

from __future__ import annotations

from agno.exceptions import CheckTrigger, InputCheckError
from agno.guardrails import BaseGuardrail, PromptInjectionGuardrail
from agno.run.agent import RunInput

from agent.intent import Intent, scrape_intent

SCOPE_REFUSAL = (
    "I can only help with Pet Connect, companion pets, and dog/cat breed questions. "
    "Try asking about matching, listings, availability, or a specific breed."
)


class ScopeGuardrail(BaseGuardrail):
    """Reject messages that fall outside Pet Connect + companion-pet context."""

    def check(self, run_input: RunInput) -> None:
        text = str(run_input.input_content or "")
        match = scrape_intent(text)

        if match.intent == Intent.OUT_OF_SCOPE:
            raise InputCheckError(
                SCOPE_REFUSAL,
                check_trigger=CheckTrigger.OFF_TOPIC,
            )

        # Empty / nonsense after scraping
        if not match.cleaned_query:
            raise InputCheckError(
                "Please type a question about Pet Connect or pet breeds.",
                check_trigger=CheckTrigger.INPUT_NOT_ALLOWED,
            )

    async def async_check(self, run_input: RunInput) -> None:
        self.check(run_input)


def build_pre_hooks() -> list:
    """Ordered guardrails applied before the main agent runs."""
    return [
        PromptInjectionGuardrail(),
        ScopeGuardrail(),
    ]
