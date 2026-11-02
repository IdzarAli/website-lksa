"""Adapter notifikasi keluar (mock) + notifikasi dashboard.

INV-7: template hanya menyebut "diterima / menunggu pemeriksaan" + referensi.
"""
from __future__ import annotations

from django.conf import settings
from django.utils import timezone

from .models import Notification, NotificationDelivery

TEMPLATE = {
    "terima-pengajuan-donasi": (
        "Pengajuan konfirmasi donasi Anda dengan referensi {ref} sudah kami terima "
        "dan menunggu pemeriksaan pengurus."
    ),
    "terima-pengajuan-sewa": (
        "Permohonan persewaan Anda dengan referensi {ref} sudah kami terima dan "
        "menunggu pemeriksaan pengurus."
    ),
}


def template_pesan(template_id: str, referensi: str) -> str:
    template = TEMPLATE.get(template_id, TEMPLATE["terima-pengajuan-donasi"])
    return template.replace("{ref}", referensi)


def send(kanal: str, penerima: str, template_id: str, referensi: str) -> tuple[bool, str | None]:
    """Kirim pesan mock. Dashboard selalu berhasil; WA/email default mati."""
    if kanal == "dashboard":
        return True, None
    if not settings.NOTIFY_ENABLED:
        return False, "kanal-dimatikan"
    template_pesan(template_id, referensi)
    return True, "mock-mengirim-tanpa-jaringan"


def kirim_notifikasi_pengajuan(
    *,
    jenis: str,
    entity_type: str,
    entity_id: str,
    referensi: str,
    template_id: str,
    penerima_wa: str,
    penerima_email: str,
) -> str:
    notifikasi = Notification.objects.create(
        jenis=jenis,
        entity_type=entity_type,
        entity_id=str(entity_id),
        referensi=referensi,
    )
    tugas = [("dashboard", "dashboard")]
    if penerima_wa:
        tugas.append(("wa", penerima_wa))
    if penerima_email:
        tugas.append(("email", penerima_email))

    for kanal, penerima in tugas:
        ok, error = send(kanal, penerima, template_id, referensi)
        NotificationDelivery.objects.create(
            notification_id=notifikasi.id,
            kanal=kanal,
            penerima=penerima,
            status="terkirim" if ok else "gagal",
            percobaan=1,
            error_ringkas=None if ok else (error or "tidak diketahui"),
            sent_at=timezone.now() if ok else None,
        )
    return str(notifikasi.id)


def kirim_ulang_delivery(delivery_id: str, template_id: str, referensi: str) -> tuple[bool, str]:
    delivery = NotificationDelivery.objects.filter(pk=delivery_id).first()
    if delivery is None:
        return False, "Delivery tidak ditemukan"
    if delivery.kanal == "dashboard":
        return False, "Kanal dashboard tidak perlu dikirim ulang"
    if delivery.status == "terkirim":
        return False, "Pesan sudah terkirim"
    if delivery.percobaan >= settings.NOTIFY_MAX_PERCOBAAN:
        return False, f"Percobaan melebihi batas ({settings.NOTIFY_MAX_PERCOBAAN})"

    ok, error = send(delivery.kanal, delivery.penerima, template_id, referensi)
    delivery.status = "terkirim" if ok else "gagal"
    delivery.percobaan += 1
    delivery.error_ringkas = None if ok else (error or "tidak diketahui")
    delivery.sent_at = timezone.now() if ok else None
    delivery.save(update_fields=["status", "percobaan", "error_ringkas", "sent_at"])
    return (True, "Pesan mock terkirim (dicatat)") if ok else (False, "Gagal mengirim (dicatat sebagai gagal)")
