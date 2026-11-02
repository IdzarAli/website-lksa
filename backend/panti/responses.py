"""Helper respons JSON yang konsisten dengan kontrak frontend."""
from __future__ import annotations

import json
from typing import Any

from django.http import HttpRequest, JsonResponse


def json_ok(data: Any, status: int = 200) -> JsonResponse:
    return JsonResponse(data, status=status, safe=False)


def json_gagal(status: int, pesan: str, extra: dict[str, Any] | None = None) -> JsonResponse:
    payload: dict[str, Any] = {"error": pesan}
    if extra:
        payload.update(extra)
    return JsonResponse(payload, status=status)


def baca_json(request: HttpRequest) -> dict[str, Any] | None:
    """Baca body JSON; None bila bukan objek JSON yang sah."""
    try:
        data = json.loads((request.body or b"{}").decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None
