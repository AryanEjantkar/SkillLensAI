"""Robust JSON extraction and recovery utilities for model responses."""

import json
import re
from typing import Any, Dict


def extract_json_from_text(raw_text: str) -> Dict[str, Any]:
    """Extract and parse a JSON dictionary from raw model text output."""
    if not raw_text or not raw_text.strip():
        raise ValueError("Model returned empty text; unable to parse JSON")

    cleaned = raw_text.strip()

    # If wrapped in markdown code fence
    fence_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    fence_match = re.search(fence_pattern, cleaned, re.IGNORECASE)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    # Fast path: try direct json.loads
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # Find the outer { and }
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        candidate = cleaned[start_idx : end_idx + 1]
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
        except Exception:
            pass

        # Clean trailing commas before } or ]
        candidate_fixed = re.sub(r",\s*([\]}])", r"\1", candidate)
        try:
            data = json.loads(candidate_fixed)
            if isinstance(data, dict):
                return data
        except Exception:
            pass

    raise ValueError(f"Could not extract valid JSON object from model response: {raw_text[:200]}...")
