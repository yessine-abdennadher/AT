export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || "Erreur serveur interne";

  // Gestion des erreurs Mongoose : ID invalide (CastError)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Ressource non trouvée avec l'identifiant : ${err.value}`;
  }

  // Gestion des erreurs Mongoose : Duplication de clé unique (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "champ";
    message = `Ce ${field} est déjà utilisé. Veuillez en choisir un autre.`;
  }

  // Gestion des erreurs Mongoose : Validation échouée
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Gestion des erreurs JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token d'authentification invalide.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expirée. Veuillez vous reconnecter.";
  }

  console.error(`[Error] ${req.method} ${req.originalUrl} (${statusCode}) - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
