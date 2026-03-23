import json
import logging
from typing import AsyncIterator
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def get_llm_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )
    return _client


async def chat_completion(messages: list[dict], model: str | None = None, json_mode: bool = False) -> str:
    client = get_llm_client()
    kwargs = {
        "model": model or settings.openai_model,
        "messages": messages,
        "temperature": 0.2,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = await client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"LLM completion error: {e}")
        raise


async def chat_completion_stream(messages: list[dict], model: str | None = None) -> AsyncIterator[str]:
    client = get_llm_client()
    try:
        stream = await client.chat.completions.create(
            model=model or settings.openai_model,
            messages=messages,
            temperature=0.3,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    except Exception as e:
        logger.error(f"LLM stream error: {e}")
        raise


async def parse_json_response(response_text: str) -> dict:
    try:
        # Strip markdown code blocks if present
        text = response_text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
            text = text.rsplit("```", 1)[0]
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON response: {response_text[:200]}")
        return {}
