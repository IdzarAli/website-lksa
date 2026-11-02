import { existsSync } from "node:fs";
import path from "node:path";

export const rootDir = path.resolve(import.meta.dirname, "..");
export const backendDir = path.join(rootDir, "backend");

/** Lokasi interpreter Python di virtualenv proyek (fallback: python dari PATH). */
export function pythonPath() {
  if (process.env.PYTHON) return process.env.PYTHON;
  const kandidat =
    process.platform === "win32"
      ? [path.join(rootDir, ".venv", "Scripts", "python.exe")]
      : [path.join(rootDir, ".venv", "bin", "python")];
  return kandidat.find(existsSync) ?? (process.platform === "win32" ? "python" : "python3");
}
