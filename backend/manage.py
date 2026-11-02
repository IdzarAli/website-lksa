#!/usr/bin/env python
"""Utilitas baris perintah Django untuk Website LKSA Danukusumo."""
import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "lksa_backend.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:  # pragma: no cover
        raise ImportError(
            "Django belum terpasang. Jalankan: pip install -r backend/requirements.txt"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
