module.exports = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  // Si ya se mandó respuesta, delega
  if (res.headersSent) return next(err);

  const status = err.statusCode || err.status || 500;

  // ¿Es petición API?
  const wantsJson =
    req.originalUrl.startsWith("/api") ||
    (req.headers.accept && req.headers.accept.includes("application/json"));

  // =========================
  // RESPUESTA PARA API (JSON)
  // =========================
  if (wantsJson) {
    return res.status(status).json({
      message: err.message || "Error interno del servidor",
      status,
    });
  }

  // =========================
  // RESPUESTA PARA WEB (EJS)
  // =========================
  // Si no es 500, redirige a 404 u otra página genérica
  if (status !== 500) {
    return res.status(status).render("errors/404", {
      title: status,
    });
  }

  // Error 500
  return res.status(500).render("errors/500", {
    title: "Error",
    message: err.message || "Ocurrió un error inesperado. Intenta más tarde.",
  });
};

