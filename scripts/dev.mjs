import { spawn } from "node:child_process";
import path from "node:path";
import { rootDir, backendDir, pythonPath } from "./python.mjs";

const api = spawn(pythonPath(), ["manage.py", "runserver", "127.0.0.1:8000"], {
  cwd: backendDir,
  stdio: "inherit",
  env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
});

const web = spawn(
  process.execPath,
  [path.join(rootDir, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", "3000"],
  { cwd: rootDir, stdio: "inherit", env: process.env },
);

let berhenti = false;
function hentikan(kode = 0) {
  if (berhenti) return;
  berhenti = true;
  for (const anak of [api, web]) {
    if (anak.exitCode !== null) continue;
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(anak.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      anak.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(kode), 300);
}

api.on("exit", (kode) => {
  console.error(`\n[api] Django berhenti (kode ${kode ?? 0}).`);
  hentikan(kode ?? 0);
});
web.on("exit", (kode) => {
  console.error(`\n[web] Next.js berhenti (kode ${kode ?? 0}).`);
  hentikan(kode ?? 0);
});
for (const sinyal of ["SIGINT", "SIGTERM"]) {
  process.on(sinyal, () => hentikan(0));
}
