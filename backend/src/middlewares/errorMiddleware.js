// backend/src/middlewares/errorMiddleware.js

/**
 * Middleware global de tratamento de erros.
 * Qualquer erro passado para next(err) cai aqui.
 */
export default function errorMiddleware(err, req, res, next) {
  console.error("🔥 ERRO NO SERVIDOR:", err);

  // Se já foi enviado, não tenta enviar de novo
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Erro interno do servidor.",
    message: err.message || "Erro inesperado.",
  });
}
