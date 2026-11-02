"""Model domain LKSA Danukusumo.

Nama field memakai snake_case (konvensi Python/Django); lapisan view memetakan
ke camelCase agar kontrak JSON tetap sama dengan frontend.
"""
from __future__ import annotations

import uuid

from django.db import models


def uid() -> uuid.UUID:
    return uuid.uuid4()


# ============ KONTEN PUBLIK ============


class Article(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    slug = models.SlugField(max_length=200, unique=True)
    judul = models.CharField(max_length=200)
    ringkasan = models.CharField(max_length=400)
    isi = models.TextField()
    kategori = models.CharField(max_length=60)
    media_url = models.CharField(max_length=500, null=True, blank=True)
    media_alt = models.CharField(max_length=200, null=True, blank=True)
    publication_consent = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, default="draf", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.judul


class Announcement(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    judul = models.CharField(max_length=200)
    isi = models.TextField()
    kategori = models.CharField(max_length=60)
    prioritas = models.CharField(max_length=20, default="biasa")
    media_url = models.CharField(max_length=500, null=True, blank=True)
    media_alt = models.CharField(max_length=200, null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, default="draf", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.judul


class InstitutionStats(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    periode = models.CharField(max_length=120)
    usia_agregat = models.JSONField(default=dict)
    pendidikan_agregat = models.JSONField(default=dict)
    alokasi = models.JSONField(default=dict)
    sumber = models.CharField(max_length=200)
    approved_by = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Institution stats"


class Staff(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    nama = models.CharField(max_length=120)
    peran = models.CharField(max_length=80)
    foto = models.CharField(max_length=500, null=True, blank=True)
    publication_consent = models.BooleanField(default=False)
    status = models.CharField(max_length=30, default="draf", db_index=True)

    class Meta:
        ordering = ["nama"]
        verbose_name_plural = "Staff"


# ============ DONASI (INV-1) ============


class DonationConfirmation(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    referensi = models.CharField(max_length=40, unique=True)
    idempotency_key = models.CharField(max_length=100, unique=True)
    nama = models.CharField(max_length=120)
    email = models.EmailField(max_length=120)
    wa = models.CharField(max_length=20)
    nominal_rupiah = models.IntegerField()
    keterangan = models.CharField(max_length=500, null=True, blank=True)
    receipt_key = models.CharField(max_length=80)
    consent_at = models.DateTimeField()
    leaderboard_consent = models.BooleanField(default=False)
    status = models.CharField(max_length=30, default="menunggu-verifikasi", db_index=True)
    verified_by = models.CharField(max_length=120, null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    keputusan_alasan = models.CharField(max_length=300, null=True, blank=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


# ============ PERSEWAAN (INV-2) ============


class RentalItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    nama = models.CharField(max_length=120)
    jenis = models.CharField(max_length=20)
    satuan = models.CharField(max_length=80)
    tarif_contoh = models.IntegerField()
    tambahan = models.JSONField(default=list)
    foto = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(max_length=30, default="draf", db_index=True)

    class Meta:
        ordering = ["nama"]


class RentalRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    referensi = models.CharField(max_length=40, unique=True)
    idempotency_key = models.CharField(max_length=100, unique=True)
    rental_item_id = models.UUIDField(db_index=True)
    penyewa = models.CharField(max_length=120)
    kontak = models.CharField(max_length=120)
    alamat = models.CharField(max_length=300)
    jadwal = models.JSONField(default=dict)
    rincian_jenis = models.JSONField(default=dict)
    estimasi_snapshot = models.JSONField(default=dict)
    status = models.CharField(max_length=30, default="diajukan", db_index=True)
    keputusan_alasan = models.CharField(max_length=300, null=True, blank=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


# ============ AUDIT, NOTIFIKASI, AKUN ============


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    actor_id = models.UUIDField(null=True, blank=True)
    aksi = models.CharField(max_length=80)
    entity_type = models.CharField(max_length=60)
    entity_id = models.CharField(max_length=80)
    perubahan_status = models.CharField(max_length=120, null=True, blank=True)
    waktu = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-waktu"]


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    jenis = models.CharField(max_length=20)
    entity_type = models.CharField(max_length=60)
    entity_id = models.CharField(max_length=80)
    referensi = models.CharField(max_length=40)
    created_at = models.DateTimeField(auto_now_add=True)
    dibaca_oleh = models.CharField(max_length=120, null=True, blank=True)
    dibaca_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class NotificationDelivery(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    notification_id = models.UUIDField(db_index=True)
    kanal = models.CharField(max_length=20)
    penerima = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default="antri")
    percobaan = models.IntegerField(default=0)
    error_ringkas = models.CharField(max_length=200, null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["id"]


class AdminUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uid, editable=False)
    email = models.EmailField(max_length=120, unique=True)
    nama = models.CharField(max_length=120)
    role = models.CharField(max_length=20)
    password_hash = models.CharField(max_length=255)

    class Meta:
        ordering = ["nama"]

    def __str__(self) -> str:
        return f"{self.nama} <{self.email}>"
