import json
import os
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings, DATA_DIR

router = APIRouter()

RUNTIME_CONFIG_PATH = DATA_DIR / "runtime_config.json"


class LLMConfigOut(BaseModel):
    provider: str
    api_key: str
    base_url: str
    model: str


class LLMConfigIn(BaseModel):
    provider: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None


def read_runtime_config() -> dict:
    if RUNTIME_CONFIG_PATH.exists():
        try:
            with open(RUNTIME_CONFIG_PATH) as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def write_runtime_config(data: dict) -> None:
    RUNTIME_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(RUNTIME_CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)


def get_effective_config() -> LLMConfigOut:
    runtime = read_runtime_config()
    return LLMConfigOut(
        provider=runtime.get("provider", settings.llm_provider),
        api_key=runtime.get("api_key", settings.llm_api_key),
        base_url=runtime.get("base_url", settings.llm_base_url),
        model=runtime.get("model", settings.llm_model),
    )


@router.get("/llm-config", response_model=LLMConfigOut)
async def get_llm_config():
    return get_effective_config()


@router.put("/llm-config", response_model=LLMConfigOut)
async def update_llm_config(data: LLMConfigIn):
    current = read_runtime_config()

    if data.provider is not None:
        current["provider"] = data.provider
    if data.api_key is not None:
        current["api_key"] = data.api_key
    if data.base_url is not None:
        current["base_url"] = data.base_url
    if data.model is not None:
        current["model"] = data.model

    write_runtime_config(current)
    return get_effective_config()


@router.delete("/llm-config")
async def reset_llm_config():
    if RUNTIME_CONFIG_PATH.exists():
        os.remove(RUNTIME_CONFIG_PATH)
    return get_effective_config()
