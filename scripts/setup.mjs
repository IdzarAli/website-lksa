import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { rootDir, backendDir, pythonPath } from "./python.mjs";

function jalankan(perintah, args, cwd) {
  const hasil = spawnSync(perintah, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
  });
  if (hasil.status !== 0) {
    console.error(`\nGagal: ${perintah} ${args.join(" ")}`);
    process.exit(hasil.status ?? 1);
  }
}

function buatVirtualenv() {
  const kandidat =
    process.platform === "win32"
      ? [["py", ["-3", "-m", "venv", ".venv"]], ["python", ["-m", "venv", ".venv"]]]
      : [["python3", ["-m", "venv", ".venv"]], ["python", ["-m", "venv", ".venv"]]];

  for (const [perintah, args] of kandidat) {
    const hasil = spawnSync(perintah, args, { cwd: rootDir, stdio: "inherit" });
    if (hasil.status === 0) return;
    if (hasil.error?.code === "ENOENT") continue;
  }
  console.error("\nGagal membuat virtualenv. Pastikan Python 3.11+ terpasang dan ada di PATH.");
  process.exit(1);
}

const venv = process.platform === "win32"
  ? path.join(rootDir, ".venv", "Scripts", "python.exe")
  : path.join(rootDir, ".venv", "bin", "python");

if (!existsSync(venv)) {
  console.log("Membuat virtualenv Python di .venv ...");
  buatVirtualenv();
}

console.log("Memasang dependensi Python ...");
jalankan(pythonPath(), ["-m", "pip", "install", "--upgrade", "pip"], backendDir);
jalankan(pythonPath(), ["-m", "pip", "install", "-r", "requirements.txt"], backendDir);

console.log("Menyiapkan database Django ...");
jalankan(pythonPath(), ["manage.py", "migrate"], backendDir);
jalankan(pythonPath(), ["manage.py", "seed"], backendDir);

console.log("\nSelesai. Jalankan `npm run dev` lalu buka http://localhost:3000");
