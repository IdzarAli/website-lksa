import { NextRequest, NextResponse } from "next/server";

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonGagal(status: number, pesan: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: pesan, ...extra }, { status });
}

/** Wrap handler agar galat tak terduga menjadi 500 rapi (tanpa bocor detail). */
export async function amankan(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    console.error("[api]", e instanceof Error ? e.message : e);
    return jsonGagal(500, "Terjadi kesalahan di server. Coba lagi.");
  }
}
