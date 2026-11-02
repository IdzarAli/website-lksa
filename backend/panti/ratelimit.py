"""Rate-limit sederhana per IP (sliding window, cache lokal)."""
from __future__ import annotations

import time

from django.conf import settings
from django.core.cache import cache
from django.http import HttpRequest


def ip_dari_request(request: HttpRequest) -> str:
    """Ambil IP klien asli.

    X-Forwarded-For hanya dipercaya jika REMOTE_ADDR ada di TRUSTED_PROXY_IPS
    untuk mencegah spoofing IP oleh klien langsung.
    """
    remote_addr = request.META.get("REMOTE_ADDR", "lokal")
    trusted_proxies = getattr(settings, "TRUSTED_PROXY_IPS", set())
    if trusted_proxies and remote_addr in trusted_proxies:
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return remote_addr


def cek_batas_laju(kunci: str, maks: int, jendela_detik: int) -> bool:
    kunci_cache = f"rl:{kunci}"
    sekarang = time.time()
    daftar = cache.get(kunci_cache) or []
    daftar = [t for t in daftar if sekarang - t < jendela_detik]
    if len(daftar) >= maks:
        cache.set(kunci_cache, daftar, jendela_detik)
        return False
    daftar.append(sekarang)
    cache.set(kunci_cache, daftar, jendela_detik)
    return True
