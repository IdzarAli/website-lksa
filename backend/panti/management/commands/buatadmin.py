"""Buat atau perbarui akun pengurus (tanpa Django admin)."""
from __future__ import annotations

from getpass import getpass

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError

from panti.models import AdminUser

PERAN = {"admin"}


class Command(BaseCommand):
    help = "Buat/perbarui akun Ruang Pengurus (email unik)."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Alamat email akun")
        parser.add_argument("--nama", required=True, help="Nama yang ditampilkan")
        parser.add_argument("--role", required=True, choices=sorted(PERAN), help="Peran akun")
        parser.add_argument(
            "--password",
            help="Kata sandi (bila kosong, diminta secara interaktif)",
        )

    def handle(self, *args, **options):
        email = (options["email"] or "").strip().lower()
        nama = (options["nama"] or "").strip()
        role = options["role"]
        if "@" not in email or len(email) > 254:
            raise CommandError("Email tidak valid.")
        if not nama:
            raise CommandError("Nama wajib diisi.")

        password = options.get("password") or getpass("Kata sandi: ")
        if len(password) < 8:
            raise CommandError("Kata sandi minimal 8 karakter.")

        akun, dibuat = AdminUser.objects.update_or_create(
            email=email,
            defaults={"nama": nama, "role": role, "password_hash": make_password(password)},
        )
        aksi = "dibuat" if dibuat else "diperbarui"
        self.stdout.write(self.style.SUCCESS(f"Akun {email} ({role}) {aksi}."))
