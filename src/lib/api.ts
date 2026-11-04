/**
 * API helper untuk deployment ke GitHub Pages.
 *
 * Saat di GitHub Pages (static export), API call harus menggunakan absolute URL
 * karena tidak ada Next.js server untuk proxy. Di local development, relative path
 * masih bisa dipakai karena ada proxy di next.config.ts.
 */

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "";

export function apiUrl(path: string): string {
  if (!BACKEND_API_URL) {
    // Fallback untuk lokal: gunakan relative path (diproses oleh proxy Next.js)
    return path;
  }
  // Pastikan path dimulai dengan /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Gunakan absolute URL untuk production
  return `${BACKEND_API_URL}${normalizedPath}`;
}

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = apiUrl(path);
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });
}

export function apiImageUrl(path: string): string {
  return apiUrl(path);
}
