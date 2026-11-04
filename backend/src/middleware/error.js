export default function errorMiddleware(err, req, res, next) {
  console.error("[Express Error]", err);
  const status = err.status || 500;
  const message = err.message || "Terjadi kesalahan server";
  res.status(status).json({ error: message });
}
