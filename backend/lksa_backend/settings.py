"""Konfigurasi Django untuk backend Website LKSA Danukusumo.

Nilai default dibuat aman-untuk-pengembangan lokal. Untuk produksi, atur
variabel lingkungan yang tercantum di README (DJANGO_SECRET_KEY, DJANGO_DEBUG,
DJANGO_ALLOWED_HOSTS, FRONTEND_ORIGIN_HOSTS, SESSION_COOKIE_SECURE).
"""
from __future__ import annotations

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Muat variabel dari .env di akar proyek (opsional; environment tetap prioritas).
load_dotenv(BASE_DIR.parent / ".env", override=False)


def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "ya", "yes", "on"}


def _env_list(name: str, default: str) -> list[str]:
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


_DEFAULT_SECRET = "dev-only-danukusumo-2026-ganti-di-produksi"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", _DEFAULT_SECRET)
DEBUG = _env_bool("DJANGO_DEBUG", True)

# Gagalkan startup produksi jika SECRET_KEY belum diganti.
if not DEBUG and SECRET_KEY == _DEFAULT_SECRET:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY wajib diisi dengan kunci acak di lingkungan produksi."
    )

ALLOWED_HOSTS = _env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")

# Hostname frontend yang boleh mengirim permintaan tulis (proteksi CSRF tambahan).
# Port tidak dibatasi agar dev (3000) dan pratinjau (81/8080) sama-sama aman.
FRONTEND_ORIGIN_HOSTS = set(
    _env_list("FRONTEND_ORIGIN_HOSTS", "localhost,127.0.0.1")
)

# Django 4+ membutuhkan ini untuk menerima POST lintas-origin (CSRF).
# Contoh produksi: CSRF_TRUSTED_ORIGINS=https://danukusumo.or.id
CSRF_TRUSTED_ORIGINS = _env_list("CSRF_TRUSTED_ORIGINS", "")
if not CSRF_TRUSTED_ORIGINS and DEBUG:
    CSRF_TRUSTED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

# IP proxy tepercaya (dipakai middleware & rate-limit untuk mendapat IP asli).
TRUSTED_PROXY_IPS: set[str] = set(
    _env_list("TRUSTED_PROXY_IPS", "")
)

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "panti",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "panti.middleware.OriginCheckMiddleware",
    "panti.middleware.PathTraversalProtectionMiddleware",
    "panti.middleware.ApiErrorMiddleware",
]

ROOT_URLCONF = "lksa_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    }
]

WSGI_APPLICATION = "lksa_backend.wsgi.application"
ASGI_APPLICATION = "lksa_backend.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
        "OPTIONS": {"timeout": 20},
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_NAME = "danukusumo_sesi"
SESSION_COOKIE_AGE = 4 * 60 * 60  # 4 jam
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = _env_bool("SESSION_COOKIE_SECURE", not DEBUG)
SESSION_SAVE_EVERY_REQUEST = False

AUTH_PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]

LANGUAGE_CODE = "id"
TIME_ZONE = "Asia/Jakarta"
USE_I18N = False
USE_TZ = True

STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
APPEND_SLASH = False

# Unggah bukti transfer maksimal 5 MB (+ sedikit ruang untuk field lain).
DATA_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024

# Penyimpanan bukti PRIVAT — sengaja di luar folder statis/publik.
RECEIPTS_DIR = Path(os.environ.get("RECEIPTS_DIR", BASE_DIR / "storage" / "receipts"))

# Kanal pesan keluar (WA/email) mock dan nonaktif secara default.
NOTIFY_ENABLED = _env_bool("NOTIFY_ENABLED", False)
NOTIFY_MAX_PERCOBAAN = int(os.environ.get("NOTIFY_MAX_PERCOBAAN", "3"))

# Cache lokal untuk rate-limit (cukup untuk satu proses dev).
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "danukusumo-ratelimit",
    }
}

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ── Header keamanan tambahan (aktif hanya di produksi) ──────────────────────
if not DEBUG:
    SECURE_HSTS_SECONDS = 31_536_000  # 1 tahun
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = _env_bool("SECURE_SSL_REDIRECT", True)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    CSRF_COOKIE_SECURE = True
