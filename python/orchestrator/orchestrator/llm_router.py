"""HTTP endpoints backing the frontend's LLM provider settings panel.

Every endpoint answers HTTP 200: a provider that is misconfigured, unreachable,
or rejecting the key is a *result* the settings panel renders inline, not a
transport failure. Responses therefore carry an ``error`` string rather than a
status code — and never echo the submitted API key back.
"""

import logging
import time

from fastapi import APIRouter

from .llm import LLMSettings, build_client, env_anthropic_key
from .models import LLMConfig

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/models")
async def list_models(config: LLMConfig) -> dict:
    """List the models the configured provider offers.

    Args:
        config: Provider, model, and credentials to inspect.

    Returns:
        ``{"models": [{"id", "name"}, ...]}``, or ``{"models": [], "error": str}``
        when the provider cannot be reached or is not configured.
    """
    try:
        client = build_client(LLMSettings(**config.model_dump()))
        return {"models": await client.list_models()}
    except Exception as exc:
        # Provider name only: the settings object carries the API key.
        logger.exception("Listing models failed for provider %s", config.provider)
        return {"models": [], "error": str(exc)}


@router.post("/test")
async def test_provider(config: LLMConfig) -> dict:
    """Round-trip one tiny completion to prove the provider actually answers.

    Args:
        config: Provider, model, and credentials to exercise.

    Returns:
        ``{"ok": True, "model", "latency_ms", "reply"}`` on success (the reply is
        truncated to 200 characters), or ``{"ok": False, "error": str}``.
    """
    started = time.monotonic()
    try:
        client = build_client(LLMSettings(**config.model_dump()))
        reply = await client.complete(
            [{"role": "user", "content": "Reply with the single word: pong"}],
            max_tokens=16,
        )
    except Exception as exc:
        # Provider name only: the settings object carries the API key.
        logger.exception("Provider test failed for provider %s", config.provider)
        return {"ok": False, "error": str(exc)}

    return {
        "ok": True,
        "model": client.model,
        "latency_ms": int((time.monotonic() - started) * 1000),
        "reply": reply[:200],
    }


@router.get("/env")
async def env_status() -> dict:
    """Report whether the server already holds an Anthropic key.

    Lets the settings panel offer "use the server's key" without ever sending
    the key itself to the browser.
    """
    return {"anthropic_api_key_present": env_anthropic_key() is not None}
