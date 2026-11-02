"""Middlewares keamanan tambahan."""
from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

from django.conf import settings
from django.http import JsonResponse

LOGGER = logging.getLogger("panti.security")

# Pola yang mencurigakan untuk path traversal.
PATTERN_PATH_TRAVERSAL = re.compile(r"(\.\./|\.\.\\\\|%2e%2e|%2e\%2e|/etc/|/proc/|/var/|/root/|/home/)", re.IGNORECASE)

class OriginCheckMiddleware:
    """Tolak POST/PATCH/DELETE lintas-situs ke /api/."""

    UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in self.UNSAFE and request.path.startswith("/api/"):
            sumber = request.META.get("HTTP_ORIGIN") or request.META.get("HTTP_REFERER")
            if sumber:
                host = urlparse(sumber).hostname or ""
                if host not in settings.FRONTEND_ORIGIN_HOSTS:
                    return JsonResponse(
                        {"error": "Asal permintaan tidak diizinkan."}, status=403
                    )
            elif not settings.DEBUG:
                # Produksi: tolak request unsafe tanpa header Origin/Referer.
                return JsonResponse(
                    {"error": "Header Origin wajib disertakan."}, status=403
                )
        return self.get_response(request)


class PathTraversalProtectionMiddleware:
    """Blokir percobaan path traversal ke endpoint admin."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if PATTERN_PATH_TRAVERSAL.search(path):
            LOGGER.warning("Path traversal attempt: %s", path)
            return JsonResponse(
                {"error": "Permintaan ditolak."}, status=403
            )
        return self.get_response(request)


class ApiErrorMiddleware:
    """Ubah galat tak terduga pada /api/ menjadi JSON 500 yang rapi."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception:  # noqa: BLE001 - sengaja menangkap semua untuk respons API
            logging.getLogger("panti.api").exception("Galat API")
            if request.path.startswith("/api/"):
                return JsonResponse(
                    {"error": "Terjadi kesalahan di server. Coba lagi."}, status=500
                )
            raise
