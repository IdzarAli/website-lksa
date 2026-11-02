"""Sesi admin berbasis sesi Django + pemeriksaan peran di server.

Proteksi CSRF menggunakan tiga lapisan:
  1. SameSite=Lax pada cookie sesi,
  2. OriginCheckMiddleware (cek Origin/Referer),
  3. Token CSRF Django (kecuali endpoint yang di-skip).
"""
from __future__ import annotations

from functools import wraps
from typing import Callable

from django.http import HttpRequest, JsonResponse
from django.middleware.csrf import CsrfViewMiddleware
from django.views.decorators.csrf import csrf_exempt

from .models import AdminUser
from .responses import json_gagal

PERAN_VALID = {"admin"}


def admin_dari_sesi(request: HttpRequest) -> AdminUser | None:
    uid = request.session.get("admin_id")
    if not uid:
        return None
    user = AdminUser.objects.filter(pk=uid).first()
    if user is None or user.role not in PERAN_VALID:
        request.session.flush()
        return None
    return user


def api_view(
    methods: list[str],
    roles: set[str] | None = None,
    *,
    skip_csrf: bool = False,
) -> Callable:
    """Decorator: metode, peran, dan proteksi CSRF.

    Secara default CSRF token Django TETAP diperiksa (lapisan ketiga selain
    SameSite + Origin). Set ``skip_csrf=True`` hanya untuk endpoint yang
    memang belum bisa menyediakan token (mis. login awal).
    """

    def decorator(fungsi: Callable) -> Callable:
        @wraps(fungsi)
        def pembungkus(request: HttpRequest, *args, **kwargs):
            if request.method not in methods:
                respons = json_gagal(405, "Metode tidak diizinkan")
                respons["Allow"] = ", ".join(methods)
                return respons
            if roles is not None:
                admin = admin_dari_sesi(request)
                if admin is None:
                    return json_gagal(401, "Harus masuk terlebih dahulu")
                if roles and admin.role not in roles:
                    return json_gagal(403, "Peran Anda tidak berwenang")
                request.admin = admin  # type: ignore[attr-defined]
            return fungsi(request, *args, **kwargs)

        # Hanya endpoint tertentu (login, form publik) yang boleh skip CSRF.
        if skip_csrf:
            pembungkus = csrf_exempt(pembungkus)

        return pembungkus

    return decorator


def peran_tidak_berwenang(pesan: str = "Tidak berwenang") -> JsonResponse:
    return json_gagal(403, pesan)
