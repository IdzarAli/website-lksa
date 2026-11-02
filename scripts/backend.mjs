import { spawn } from "node:child_process";
import { backendDir, pythonPath } from "./python.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Pemakaian: node scripts/backend.mjs <perintah manage.py>");
  process.exit(1);
}

const anak = spawn(pythonPath(), ["manage.py", ...args], {
  cwd: backendDir,
  stdio: "inherit",
  env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
});

anak.on("exit", (kode) => process.exit(kode ?? 0));
for (const sinyal of ["SIGINT", "SIGTERM"]) {
  process.on(sinyal, () => anak.kill(sinyal));
}
