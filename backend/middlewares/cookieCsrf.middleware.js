const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SESSION_COOKIE_NAMES = ["activitytn_access", "activitytn_refresh"];

export const cookieCsrfGuard = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookies = String(req.headers.cookie || "");
  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) =>
    cookies.split(";").some((part) => part.trim().startsWith(`${name}=`))
  );
  if (!hasSessionCookie) return next();

  const origin = req.get("origin");
  const allowedOrigins = req.app.locals.allowedOrigins || [];
  if (origin && allowedOrigins.includes(origin)) return next();

  return res.status(403).json({
    success: false,
    message: "Origine de requête refusée pour une session navigateur.",
  });
};
