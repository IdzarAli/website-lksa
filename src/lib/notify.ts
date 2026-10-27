import type { PrismaClient } from "@prisma/client";
import { siteConfig } from "@/config/site";

/**
 * Adapter pesan keluar (OD-10, OD-11) — MOCK ONLY.
 * Tidak ada pesan nyata yang dikirim ke WA/email; hanya dicatat di dashboard.
 *
 * Antarmuka tunggal (kontrak dipertahankan saat migrasi):
 *   send(kanal, penerima, templateId, { referensi })
 *
 * INV-7: template HANYA boleh mengatakan "diterima / menunggu pemeriksaan"
 * + nomor referensi. DILARANG mengandung "terverifikasi", "lunas", "disetujui",
 * bukti, nominal, atau data pribadi berlebih.
 */

export type Kanal = "dashboard" | "wa" | "email";

export interface HasilKirim {
  ok: boolean;
  errorRingkas?: string;
}

const TEMPLATE: Record<string, string> = {
  "terima-pengajuan-donasi":
    "Pengajuan konfirmasi donasi Anda dengan referensi {ref} sudah kami terima dan menunggu pemeriksaan pengurus.",
  "terima-pengajuan-sewa":
    "Permohonan persewaan Anda dengan referensi {ref} sudah kami terima dan menunggu pemeriksaan pengurus.",
};

/** Render template — netral sesuai INV-7. */
export function templatePesan(templateId: string, { referensi }: { referensi: string }): string {
  const t = TEMPLATE[templateId] ?? TEMPLATE["terima-pengajuan-donasi"];
  return t.replace("{ref}", referensi);
}

/**
 * Adapter pengiriman (mock).
 * - kanal "dashboard": selalu "berhasil" (notifikasi tampil di dashboard admin)
 * - kanal "wa"/"email": mock; default MATI (siteConfig.notify.enabled = false);
 *   saat mati, pengiriman tidak dicoba dan dikembalikan gagal ringkas.
 */
export async function send(
  kanal: Kanal,
  penerima: string,
  templateId: string,
  opts: { referensi: string }
): Promise<HasilKirim> {
  if (kanal === "dashboard") {
    // notifikasi dashboard selalu aktif
    return { ok: true };
  }
  if (!siteConfig.notify.enabled) {
    return { ok: false, errorRingkas: "kanal-dimatikan" };
  }
  // TODO(OD-11): integrasi penyedia WA/email sungguhan — saat ini mock.
  void templatePesan(templateId, opts);
  void penerima;
  return { ok: true, errorRingkas: "mock-mengirim-tanpa-jaringan" };
}

/**
 * Buat Notification (untuk dashboard) + percobaan kirim ke kanal keluar.
 * Dipanggil SETELAH pengajuan tersimpan. Kegagalan kirim TIDAK membatalkan
 * pengajuan; kegagalannya dicatat pada NotificationDelivery ("gagal") dan
 * bisa dikirim ulang dari dashboard (percobaan dibatasi).
 */
export async function kirimNotifikasiPengajuan(
  db: PrismaClient,
  data: {
    jenis: "donasi" | "persewaan";
    entityType: string;
    entityId: string;
    referensi: string;
    templateId: string;
    penerimaWa: string;
    penerimaEmail: string;
  }
): Promise<string> {
  const notifikasi = await db.notification.create({
    data: {
      jenis: data.jenis,
      entityType: data.entityType,
      entityId: data.entityId,
      referensi: data.referensi,
    },
  });

  const tugas: { kanal: Kanal; penerima: string; templateId: string }[] = [
    { kanal: "dashboard", penerima: "dashboard", templateId: data.templateId },
  ];
  if (data.penerimaWa) tugas.push({ kanal: "wa", penerima: data.penerimaWa, templateId: data.templateId });
  if (data.penerimaEmail) tugas.push({ kanal: "email", penerima: data.penerimaEmail, templateId: data.templateId });

  for (const t of tugas) {
    const hasil = await send(t.kanal, t.penerima, t.templateId, { referensi: data.referensi });
    await db.notificationDelivery.create({
      data: {
        notificationId: notifikasi.id,
        kanal: t.kanal,
        penerima: t.kanal === "dashboard" ? "dashboard" : t.penerima,
        status: hasil.ok ? "terkirim" : "gagal",
        percobaan: 1,
        errorRingkas: hasil.ok ? null : (hasil.errorRingkas ?? "tidak diketahui"),
        sentAt: hasil.ok ? new Date() : null,
      },
    });
  }
  return notifikasi.id;
}

/**
 * Kirim ulang delivery yang gagal (dari dashboard). Percobaan dibatasi
 * siteConfig.notify.maxPercobaan.
 */
export async function kirimUlangDelivery(
  db: PrismaClient,
  deliveryId: string,
  templateId: string,
  referensi: string
): Promise<{ ok: boolean; pesan: string }> {
  const d = await db.notificationDelivery.findUnique({ where: { id: deliveryId } });
  if (!d) return { ok: false, pesan: "Delivery tidak ditemukan" };
  if (d.kanal === "dashboard") return { ok: false, pesan: "Kanal dashboard tidak perlu dikirim ulang" };
  if (d.status === "terkirim") return { ok: false, pesan: "Pesan sudah terkirim" };
  if (d.percobaan >= siteConfig.notify.maxPercobaan) {
    return { ok: false, pesan: `Percobaan melebihi batas (${siteConfig.notify.maxPercobaan})` };
  }
  const hasil = await send(d.kanal as Kanal, d.penerima, templateId, { referensi });
  await db.notificationDelivery.update({
    where: { id: d.id },
    data: {
      status: hasil.ok ? "terkirim" : "gagal",
      percobaan: d.percobaan + 1,
      errorRingkas: hasil.ok ? null : (hasil.errorRingkas ?? "tidak diketahui"),
      sentAt: hasil.ok ? new Date() : null,
    },
  });
  return hasil.ok
    ? { ok: true, pesan: "Pesan mock terkirim (dicatat)" }
    : { ok: false, pesan: "Gagal mengirim (dicatat sebagai gagal)" };
}
