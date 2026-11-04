import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { initDatabase } from "./models/database.js";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/public.js";
import { sessionMiddleware } from "./middleware/session.js";
import errorMiddleware from "./middleware/error.js";

dotenv.config();

process.on("unhandledRejection", (err) => {
  console.error("[Unhandled Rejection]", err);
});

const app = express();
const PORT = process.env.PORT || 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(",") || "*", credentials: true }));
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));
app.use(cookieParser());
app.use(sessionMiddleware);

// Static: uploads publik (foto)
app.use("/media/uploads", express.static(path.join(__dirname, "..", "uploads")));
// Static: assets publik lain (images, dll)
app.use("/static", express.static(path.join(__dirname, "..", "public")));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true, service: "lksa-backend-express" }));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api", publicRoutes);

// Error handler
app.use(errorMiddleware);

// Init DB lalu start
initDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend Express berjalan di http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Gagal init database:", err);
    process.exit(1);
  });
