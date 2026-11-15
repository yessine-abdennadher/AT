import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { User } from "../models/User.js";
import { OtpVerification } from "../models/OtpVerification.js";
import { AdminLoginChallenge } from "../models/AdminLoginChallenge.js";
import { sendAdminLoginOtpEmail, sendPartnerOtpEmail } from "./mail.service.js";
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRE } from "../config/jwt.config.js";

// Génération de tokens JWT
const hashRefreshToken = (token) => createHash("sha256").update(token).digest("hex");

const issueSessionTokens = (id, sessionId = randomUUID(), { mfa = false } = {}) => ({
  sessionId,
  accessToken: jwt.sign({ id, sid: sessionId, ...(mfa ? { mfa: true } : {}) }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  }),
  refreshToken: jwt.sign({ id, sid: sessionId, ...(mfa ? { mfa: true } : {}) }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  }),
});

const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}${"*".repeat(Math.max(2, name.length - 1))}@${domain}`;
};

const createAdminLoginChallenge = async (user) => {
  const challengeId = randomBytes(32).toString("base64url");
  const otpCode = randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otpCode, await bcrypt.genSalt(10));
  const challengeHash = hashRefreshToken(challengeId);
  await AdminLoginChallenge.deleteMany({ userId: user._id });
  await AdminLoginChallenge.create({
    userId: user._id,
    challengeHash,
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  try {
    await sendAdminLoginOtpEmail({ email: user.email, otpCode });
  } catch (error) {
    await AdminLoginChallenge.deleteOne({ challengeHash });
    throw error;
  }
  return { mfaRequired: true, challengeId, maskedEmail: maskEmail(user.email) };
};

const rememberSession = (user, session) => {
  const refreshHashes = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
  const sessionIds = Array.isArray(user.activeAccessSessionIds) ? user.activeAccessSessionIds : [];
  const aligned = refreshHashes.length === sessionIds.length && refreshHashes.every((value) => /^[a-f0-9]{64}$/i.test(value));
  user.refreshTokens = aligned ? refreshHashes : [];
  user.activeAccessSessionIds = aligned ? sessionIds : [];

  while (user.refreshTokens.length >= 5) {
    user.refreshTokens.shift();
    user.activeAccessSessionIds.shift();
  }
  user.refreshTokens.push(hashRefreshToken(session.refreshToken));
  user.activeAccessSessionIds.push(session.sessionId);
};

// Formateur de données utilisateur sécurisé
export const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  userType: user.userType,
  partnerTier: user.partnerTier || "standard",
  requestedTier: user.requestedTier || "standard",
  requestedBillingCycle: user.requestedBillingCycle || "monthly",
  subscriptionStatus: user.subscriptionStatus || "none",
  subscriptionStartedAt: user.subscriptionStartedAt,
  subscriptionExpiresAt: user.subscriptionExpiresAt,
  daysRemaining: user.daysRemaining || 0,
  isExpiringSoon: user.isExpiringSoon || false,
  isEmailVerified: user.isEmailVerified || false,
  establishmentName: user.establishmentName || "",
  avatar: user.avatar,
  bio: user.bio,
  city: user.city,
  lastLogin: user.lastLogin,
});

/**
 * Inscription d'un nouvel utilisateur
 */
export const registerUser = async ({ name, email, password, bio }) => {
  if (typeof email !== "string" || !email.trim() || email.length > 254 || typeof password !== "string" || password.length < 12 || password.length > 128) {
    const error = new Error("Une adresse email valide et un mot de passe de 12 à 128 caractères sont obligatoires.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Cet email est déjà enregistré.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: "user",
    bio: bio || "",
  });

  const session = issueSessionTokens(user._id.toString());
  rememberSession(user, session);
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: formatUserResponse(user),
  };
};

/**
 * Connexion avec email & mot de passe
 */
export const loginUser = async ({ email, password }) => {
  if (typeof email !== "string" || !email.trim() || email.length > 254 || typeof password !== "string" || !password || password.length > 128) {
    const error = new Error("Veuillez fournir un email et un mot de passe.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  const user = await User.findOne({ email: normalizedEmail }).select("+password +refreshTokens +activeAccessSessionIds");
  if (!user || !(await user.matchPassword(password))) {
    const error = new Error("Email ou mot de passe incorrect.");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Votre compte est désactivé. Veuillez contacter un administrateur.");
    error.statusCode = 403;
    throw error;
  }

  if (user.role === "admin") {
    return createAdminLoginChallenge(user);
  }

  user.lastLogin = new Date();

  const session = issueSessionTokens(user._id.toString());
  rememberSession(user, session);

  await user.save({ validateBeforeSave: false });

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: formatUserResponse(user),
  };
};

export const verifyAdminLoginOtp = async ({ challengeId, otp }) => {
  if (typeof challengeId !== "string" || challengeId.length < 32 || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    const error = new Error("Un code de connexion administrateur valide est obligatoire.");
    error.statusCode = 400;
    throw error;
  }
  const challengeHash = hashRefreshToken(challengeId);
  const challenge = await AdminLoginChallenge.findOne({ challengeHash }).select("+otpHash");
  if (!challenge || challenge.expiresAt <= new Date()) {
    const error = new Error("Code de connexion invalide ou expiré.");
    error.statusCode = 401;
    throw error;
  }
  if (challenge.attempts >= 5) {
    await AdminLoginChallenge.deleteOne({ _id: challenge._id });
    const error = new Error("Trop de tentatives. Recommencez la connexion.");
    error.statusCode = 429;
    throw error;
  }
  if (!(await bcrypt.compare(otp, challenge.otpHash))) {
    const updated = await AdminLoginChallenge.findOneAndUpdate(
      { _id: challenge._id, attempts: { $lt: 5 } },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    if (!updated) await AdminLoginChallenge.deleteOne({ _id: challenge._id });
    const error = new Error(updated ? "Code de connexion incorrect." : "Trop de tentatives. Recommencez la connexion.");
    error.statusCode = updated ? 401 : 429;
    throw error;
  }

  const claimed = await AdminLoginChallenge.findOneAndDelete({ _id: challenge._id, attempts: { $lt: 5 } });
  if (!claimed) {
    const error = new Error("Ce code a déjà été utilisé.");
    error.statusCode = 401;
    throw error;
  }
  const user = await User.findById(challenge.userId).select("+refreshTokens +activeAccessSessionIds");
  if (!user || !user.isActive || user.role !== "admin") {
    const error = new Error("Le compte administrateur n’est plus actif.");
    error.statusCode = 403;
    throw error;
  }
  user.lastLogin = new Date();
  const session = issueSessionTokens(user._id.toString(), randomUUID(), { mfa: true });
  rememberSession(user, session);
  await user.save({ validateBeforeSave: false });
  return { accessToken: session.accessToken, refreshToken: session.refreshToken, user: formatUserResponse(user) };
};

/**
 * Renouvellement du token d'accès via le refresh token
 */
export const refreshAccessToken = async (tokenFromReq) => {
  if (!tokenFromReq) {
    const error = new Error("Refresh token obligatoire.");
    error.statusCode = 400;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(tokenFromReq, JWT_REFRESH_SECRET);
  } catch (err) {
    const error = new Error("Refresh token invalide ou expiré.");
    error.statusCode = 401;
    throw error;
  }

  if (!decoded.sid) {
    const error = new Error("Refresh token invalide ou expiré.");
    error.statusCode = 401;
    throw error;
  }

  const nextSession = issueSessionTokens(decoded.id, randomUUID(), { mfa: decoded.mfa === true });
  const user = await User.findOneAndUpdate(
    {
      _id: decoded.id,
      isActive: true,
      refreshTokens: hashRefreshToken(tokenFromReq),
      activeAccessSessionIds: decoded.sid,
    },
    [{
      $set: {
        refreshTokens: {
          $concatArrays: [
            { $filter: { input: { $ifNull: ["$refreshTokens", []] }, as: "token", cond: { $ne: ["$$token", hashRefreshToken(tokenFromReq)] } } },
            [hashRefreshToken(nextSession.refreshToken)],
          ],
        },
        activeAccessSessionIds: {
          $concatArrays: [
            { $filter: { input: { $ifNull: ["$activeAccessSessionIds", []] }, as: "sid", cond: { $ne: ["$$sid", decoded.sid] } } },
            [nextSession.sessionId],
          ],
        },
      },
    }],
    { new: true }
  );
  if (!user) {
    const error = new Error("Refresh token non reconnu ou révoqué.");
    error.statusCode = 401;
    throw error;
  }

  return {
    accessToken: nextSession.accessToken,
    refreshToken: nextSession.refreshToken,
  };
};

/**
 * Déconnexion / Révocation de session
 */
export const logoutUser = async (userId, refreshToken) => {
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      if ((!userId || decoded.id?.toString() === userId.toString()) && decoded.sid) {
        await User.updateOne(
          {
            _id: decoded.id,
            refreshTokens: hashRefreshToken(refreshToken),
            activeAccessSessionIds: decoded.sid,
          },
          {
            $pull: {
              refreshTokens: hashRefreshToken(refreshToken),
              activeAccessSessionIds: decoded.sid,
            },
          }
        );
      }
    } catch {
      // A bad or expired refresh token cannot revoke another user's session.
    }
  }
  return true;
};

/**
 * Récupération du profil
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }
  return formatUserResponse(user);
};

/**
 * Mise à jour du profil
 */
export const updateUserProfile = async (userId, { name, bio, avatar, city, establishmentName }, userRole) => {
  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (bio !== undefined) fieldsToUpdate.bio = bio;
  if (avatar) fieldsToUpdate.avatar = avatar;
  if (typeof city === "string") fieldsToUpdate.city = city.trim().slice(0, 100);
  if (establishmentName !== undefined && userRole === "partner") {
    fieldsToUpdate.establishmentName = establishmentName;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  return formatUserResponse(updatedUser);
};

/**
 * Récupération des favoris
 */
export const getUserFavorites = async (userId) => {
  const user = await User.findById(userId).populate("favorites");
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  const favoriteIds = (user.favorites || []).map((fav) => fav._id?.toString() || fav.toString());
  return {
    count: user.favorites.length,
    favoriteIds,
    favorites: user.favorites,
  };
};

/**
 * Authentification avec Google OAuth
 */
export const authenticateWithGoogle = async ({ idToken }) => {
  const allowedClientIds = String(process.env.GOOGLE_CLIENT_IDS || "")
    .split(",")
    .map((clientId) => clientId.trim())
    .filter(Boolean);
  if (!allowedClientIds.length) {
    const error = new Error("La connexion Google n'est pas configurée sur le serveur.");
    error.statusCode = 503;
    throw error;
  }
  if (typeof idToken !== "string" || !idToken.trim()) {
    const error = new Error("Un jeton d'identité Google valide est obligatoire.");
    error.statusCode = 401;
    throw error;
  }

  let verificationResponse;
  try {
    const tokenInfoUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    tokenInfoUrl.searchParams.set("id_token", idToken);
    verificationResponse = await fetch(tokenInfoUrl, { signal: AbortSignal.timeout(5000) });
  } catch {
    const error = new Error("La vérification Google est temporairement indisponible.");
    error.statusCode = 503;
    throw error;
  }
  if (!verificationResponse.ok) {
    const error = new Error("Jeton d'identité Google invalide ou expiré.");
    error.statusCode = 401;
    throw error;
  }

  const identity = await verificationResponse.json();
  const allowedIssuers = new Set(["accounts.google.com", "https://accounts.google.com"]);
  const isVerified = identity.email_verified === true || identity.email_verified === "true";
  const expiresAt = Number(identity.exp) * 1000;
  if (
    !allowedClientIds.includes(identity.aud) ||
    !allowedIssuers.has(identity.iss) ||
    !isVerified ||
    !identity.sub ||
    !identity.email ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  ) {
    const error = new Error("L'identité Google n'a pas pu être vérifiée pour cette application.");
    error.statusCode = 401;
    throw error;
  }

  const verifiedEmail = String(identity.email).trim().toLowerCase();
  let user = await User.findOne({
    $or: [{ email: verifiedEmail }, { googleId: identity.sub }],
  }).select("+refreshTokens +activeAccessSessionIds");

  if (user && !user.isActive) {
    const error = new Error("Votre compte est désactivé. Veuillez contacter un administrateur.");
    error.statusCode = 403;
    throw error;
  }

  if (user?.role === "admin") {
    const error = new Error("Les comptes administrateur doivent se connecter avec mot de passe et code email.");
    error.statusCode = 403;
    throw error;
  }

  if (user) {
    if (!user.googleId) user.googleId = identity.sub;
    if (identity.picture && (!user.avatar || user.avatar.includes("unsplash"))) user.avatar = identity.picture;
    user.lastLogin = new Date();
  } else {
    user = await User.create({
      name: identity.name || verifiedEmail.split("@")[0],
      email: verifiedEmail,
      avatar: identity.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      role: "user",
      provider: "google",
      googleId: identity.sub,
      lastLogin: new Date(),
    });
  }

  const session = issueSessionTokens(user._id.toString());
  rememberSession(user, session);
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: formatUserResponse(user),
  };
};

/**
 * Étape 1 : Initialisation & Envoi du code OTP pour partenaire
 */
export const sendPartnerOtp = async ({
  managerName,
  email,
  establishmentName,
  whatsapp,
  city = "Sfax",
  category = "cafe",
  plan = "standard",
  billingCycle = "monthly",
}) => {
  if (
    typeof email !== "string" || !email.trim() || email.length > 254 ||
    typeof managerName !== "string" || !managerName.trim() ||
    typeof establishmentName !== "string" || !establishmentName.trim() ||
    typeof whatsapp !== "string"
  ) {
    const error = new Error("Les informations du partenaire sont incomplètes ou invalides.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedEmail = email.trim().toLowerCase();
  // 1. Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Un compte existe déjà avec cette adresse email.");
    error.statusCode = 400;
    throw error;
  }

  // 2. Générer un code OTP cryptographique à 6 chiffres
  const rawOtp = randomInt(100000, 1000000).toString();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(rawOtp, salt);

  // 3. Sauvegarder dans la collection éphémère (TTL 10 min)
  await OtpVerification.deleteMany({ email: normalizedEmail });
  await OtpVerification.create({
    email: normalizedEmail,
    otpHash,
    partnerData: {
      name: managerName.trim(),
      establishmentName: establishmentName.trim(),
      phone: whatsapp.trim(),
      city,
      category,
      plan,
      billingCycle,
    },
  });

  // 4. Déclencher l'envoi de l'email officiel (Resend / Log local)
  try {
    await sendPartnerOtpEmail({ email: normalizedEmail, managerName, establishmentName, otpCode: rawOtp });
  } catch (error) {
    await OtpVerification.deleteMany({ email: normalizedEmail });
    throw error;
  }

  return {
    success: true,
    email: normalizedEmail,
  };
};

/**
 * Étape 2 : Vérification du code OTP & Création sécurisée du compte Partenaire
 */
export const verifyPartnerOtp = async ({ email, otp, password }) => {
  if (typeof email !== "string" || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    const error = new Error("Un email et un code de vérification à 6 chiffres sont obligatoires.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    const error = new Error("Le mot de passe doit contenir entre 12 et 128 caractères.");
    error.statusCode = 400;
    throw error;
  }

  const otpRecord = await OtpVerification.findOne({ email: normalizedEmail });
  if (!otpRecord) {
    const error = new Error("Code expiré ou demande introuvable. Veuillez recommencer.");
    error.statusCode = 400;
    throw error;
  }

  // Anti-bruteforce (3 essais maximum)
  if (otpRecord.attempts >= 3) {
    await OtpVerification.deleteOne({ _id: otpRecord._id });
    const error = new Error("Trop de tentatives incorrectes. Veuillez demander un nouveau code.");
    error.statusCode = 429;
    throw error;
  }

  const isMatch = await bcrypt.compare(otp.trim(), otpRecord.otpHash);
  if (!isMatch) {
    const updatedOtp = await OtpVerification.findOneAndUpdate(
      { _id: otpRecord._id, attempts: { $lt: 3 } },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    if (!updatedOtp) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      const error = new Error("Trop de tentatives incorrectes. Veuillez demander un nouveau code.");
      error.statusCode = 429;
      throw error;
    }
    const error = new Error("Code de vérification incorrect.");
    error.statusCode = 400;
    throw error;
  }

  const claimedOtp = await OtpVerification.findOneAndDelete({
    _id: otpRecord._id,
    otpHash: otpRecord.otpHash,
    attempts: { $lt: 3 },
  });
  if (!claimedOtp) {
    const error = new Error("Ce code a déjà été utilisé ou a expiré. Veuillez recommencer.");
    error.statusCode = 409;
    throw error;
  }

  const data = claimedOtp.partnerData;
  const isPaidPlan = data.plan === "pro" || data.plan === "premium";

  // Création du compte Partenaire : partnerTier est TOUJOURS "standard" par défaut !
  const newUser = await User.create({
    name: data.name,
    email: normalizedEmail,
    password,
    phone: data.phone,
    establishmentName: data.establishmentName,
    city: data.city,
    role: "partner",
    partnerTier: "standard", // Verrou de sécurité 0 DT
    requestedTier: data.plan, // Forfait souhaité
    requestedBillingCycle: data.billingCycle || "monthly",
    subscriptionStatus: isPaidPlan ? "pending_payment" : "none",
    isEmailVerified: true,
  });

  // Génération des JWT
  const session = issueSessionTokens(newUser._id.toString());
  rememberSession(newUser, session);
  newUser.lastLogin = new Date();
  await newUser.save({ validateBeforeSave: false });

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: formatUserResponse(newUser),
  };
};

/**
 * Envoi du code OTP de réinitialisation de mot de passe
 */
export const sendPasswordResetOtp = async ({ email }) => {
  if (typeof email !== "string" || !email.trim()) {
    const error = new Error("L'adresse email est obligatoire.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  let generatedOtp = null;

  if (user && user.isActive) {
    const { randomInt } = await import("crypto");
    const rawOtp = randomInt(100000, 1000000).toString();
    generatedOtp = rawOtp;
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    await OtpVerification.deleteMany({ email: normalizedEmail });
    await OtpVerification.create({
      email: normalizedEmail,
      otpHash,
      partnerData: { type: "password_reset", userId: user._id.toString() },
    });

    const { sendPasswordResetOtpEmail } = await import("./mail.service.js");
    await sendPasswordResetOtpEmail({ email: user.email, name: user.name, otpCode: rawOtp }).catch((err) => {
      console.warn("[Password Reset] Email warning:", err.message);
    });
  } else {
    // Protection contre les attaques temporelles (Timing Attacks) :
    // Effectuer une charge de hachage identique pour neutraliser la déduction par mesure de latence
    const salt = await bcrypt.genSalt(10);
    await bcrypt.hash("000000", salt);
  }

  const isDev = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "prod";

  // Toujours renvoyer un statut positif pour éviter le dénombrement des comptes
  return {
    success: true,
    message: "Si un compte est associé à cette adresse, vous recevrez un code à 6 chiffres.",
    email: normalizedEmail,
    ...(isDev && generatedOtp ? { devOtp: generatedOtp } : {}),
  };
};

/**
 * Étape intermédiaire : Vérification du code OTP avant redirection vers la saisie du nouveau mot de passe
 */
export const verifyPasswordResetOtp = async ({ email, otp }) => {
  if (typeof email !== "string" || !email.trim() || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    const error = new Error("Un email et un code de vérification à 6 chiffres sont obligatoires.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedEmail = email.trim().toLowerCase();

  const record = await OtpVerification.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
  if (!record) {
    const error = new Error("Code de vérification expiré ou introuvable. Veuillez redemander un nouveau code.");
    error.statusCode = 400;
    throw error;
  }

  if (record.attempts >= 5) {
    console.warn(`[Security Alert] Dépassement des tentatives OTP (${record.attempts}/5) pour ${normalizedEmail}. Code révoqué.`);
    await OtpVerification.deleteMany({ email: normalizedEmail });
    const error = new Error("Trop de tentatives erronées. Veuillez redemander un nouveau code.");
    error.statusCode = 429;
    throw error;
  }

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) {
    record.attempts += 1;
    await record.save();
    const error = new Error("Code de vérification incorrect. Veuillez vérifier vos emails.");
    error.statusCode = 400;
    throw error;
  }

  return {
    success: true,
    message: "Code validé avec succès. Vous pouvez maintenant définir votre nouveau mot de passe.",
  };
};

/**
 * Réinitialisation effective du mot de passe avec le code OTP
 */
export const resetPasswordWithOtp = async ({ email, otp, newPassword }) => {
  if (typeof email !== "string" || !email.trim() || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    const error = new Error("Un email et un code à 6 chiffres sont obligatoires.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedEmail = email.trim().toLowerCase();

  if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 128) {
    const error = new Error("Le nouveau mot de passe doit comporter entre 12 et 128 caractères.");
    error.statusCode = 400;
    throw error;
  }

  const record = await OtpVerification.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
  if (!record) {
    const error = new Error("Code de vérification expiré ou introuvable. Veuillez demander un nouveau code.");
    error.statusCode = 400;
    throw error;
  }

  if (record.attempts >= 5) {
    console.warn(`[Security Alert] Dépassement des tentatives erronées de reset (${record.attempts}/5) pour ${normalizedEmail}.`);
    await OtpVerification.deleteMany({ email: normalizedEmail });
    const error = new Error("Trop de tentatives erronées. Veuillez redemander un nouveau code.");
    error.statusCode = 429;
    throw error;
  }

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) {
    record.attempts += 1;
    await record.save();
    const error = new Error("Code de vérification incorrect. Veuillez vérifier vos emails.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password +refreshTokens +activeAccessSessionIds");
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  user.password = newPassword;
  user.refreshTokens = [];
  user.activeAccessSessionIds = [];
  await user.save();
  await OtpVerification.deleteMany({ email: normalizedEmail });

  console.log(`[Security Audit] Réinitialisation de mot de passe réussie pour ${normalizedEmail} (ID: ${user._id}). Toutes les sessions révoquées.`);

  return {
    success: true,
    message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
  };
};
