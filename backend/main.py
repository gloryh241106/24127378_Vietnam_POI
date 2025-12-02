"""FastAPI backend that proxies HuggingFace translation models.

The frontend sends plain English text to `/translate`, this service forwards
it to the model defined by `HF_TRANSLATION_MODEL` and returns the Vietnamese
output. Use an `.env` file (see `.env.example`) or environment variables to
configure the HuggingFace API token before starting the server.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

HF_MODEL_ID = os.getenv("HF_TRANSLATION_MODEL", "Helsinki-NLP/opus-mt-en-vi")
HF_ROUTER_BASE_URL = os.getenv("HF_ROUTER_BASE_URL", "https://router.huggingface.co/hf-inference/models")
HF_API_URL = f"{HF_ROUTER_BASE_URL.rstrip('/')}/{HF_MODEL_ID}"
DEFAULT_TIMEOUT = httpx.Timeout(20.0, connect=10.0)

app = FastAPI(
    title="POI Map Translation API",
    version="1.0.0",
    description="Thin FastAPI wrapper around HuggingFace translation endpoints.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Source text to translate")
    source_lang: str = Field(default="en", max_length=8)
    target_lang: str = Field(default="vi", max_length=8)


class TranslationResponse(BaseModel):
    translated_text: str
    model_id: str


@app.on_event("startup")
async def init_http_client() -> None:
    app.state.http_client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT)


@app.on_event("shutdown")
async def close_http_client() -> None:
    http_client: Optional[httpx.AsyncClient] = getattr(app.state, "http_client", None)
    if http_client:
        await http_client.aclose()


@app.get("/health")
async def health_check() -> dict[str, Any]:
    return {"status": "ok", "model": HF_MODEL_ID}


@app.post("/translate", response_model=TranslationResponse)
async def translate(payload: TranslationRequest) -> TranslationResponse:
    token = os.getenv("HF_API_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="HF_API_TOKEN is not configured on the server")

    http_client: Optional[httpx.AsyncClient] = getattr(app.state, "http_client", None)
    if http_client is None:
        raise HTTPException(status_code=500, detail="HTTP client is not ready yet")
    client: httpx.AsyncClient = http_client
    translated_input, parameters = _prepare_model_payload(
        HF_MODEL_ID,
        payload.text,
        source_lang=payload.source_lang,
        target_lang=payload.target_lang,
    )
    hf_payload: dict[str, Any] = {"inputs": translated_input}
    if parameters:
        hf_payload["parameters"] = parameters

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    try:
        response = await client.post(HF_API_URL, headers=headers, json=hf_payload)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach HuggingFace: {exc}") from exc

    if response.status_code >= 400:
        detail = _extract_error_detail(response)
        raise HTTPException(status_code=response.status_code, detail=detail)

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Unable to decode HuggingFace response") from exc

    translated_text = _extract_translation_text(data)
    if not translated_text:
        raise HTTPException(status_code=502, detail="HuggingFace did not return translated_text")

    return TranslationResponse(translated_text=translated_text, model_id=HF_MODEL_ID)


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or "HuggingFace returned an error"

    if isinstance(payload, dict):
        return payload.get("error") or payload.get("message") or str(payload)
    return str(payload)


def _extract_translation_text(payload: Any) -> Optional[str]:
    """Handle the different list/dict shapes returned by HF endpoints."""

    if isinstance(payload, list):
        for item in payload:
            text = _extract_translation_text(item)
            if text:
                return text
    elif isinstance(payload, dict):
        text_value = payload.get("translation_text") or payload.get("generated_text")
        if isinstance(text_value, str) and text_value.strip():
            return text_value.strip()
    return None


NLLB_LANGUAGE_CODES = {
    "en": "eng_Latn",
    "vi": "vie_Latn",
}

MBART_LANGUAGE_CODES = {
    "en": "en_XX",
    "vi": "vi_VN",
}

OPUS_TARGET_TAGS = {
    "en": ">>eng<<",
    "vi": ">>vie<<",
}


def _prepare_model_payload(
    model_id: str,
    text: str,
    *,
    source_lang: str,
    target_lang: str,
) -> tuple[str, dict[str, str]]:
    """Normalize payload/parameters for the selected translation model."""

    model_id_lower = model_id.lower()
    parameters: dict[str, str] = {}
    normalized_text = text

    if "nllb" in model_id_lower:
        parameters["src_lang"] = NLLB_LANGUAGE_CODES.get(source_lang, source_lang)
        parameters["tgt_lang"] = NLLB_LANGUAGE_CODES.get(target_lang, target_lang)
    elif "mbart" in model_id_lower:
        parameters["src_lang"] = MBART_LANGUAGE_CODES.get(source_lang, source_lang)
        parameters["tgt_lang"] = MBART_LANGUAGE_CODES.get(target_lang, target_lang)
    elif "opus-mt" in model_id_lower:
        target_tag = OPUS_TARGET_TAGS.get(target_lang)
        if target_tag:
            normalized_text = f"{target_tag} {text}".strip()

    # Remove empty strings that would break HF payload validation
    parameters = {k: v for k, v in parameters.items() if v}
    return normalized_text, parameters