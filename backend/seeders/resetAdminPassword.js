import dotenv from "dotenv";
import mongoose from "mongoose";
import { AdminLoginChallenge } from "../models/AdminLoginChallenge.js";
import { User } from "../models/User.js";

dotenv.config();

const email = String(process.env.RESET_ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.RESET_ADMIN_PASSWORD || "");
const confirmation = process.env.CONFIRM_ADMIN_PASSWORD_RESET;

if (!email || !password || password.length < 16 || confirmation !== "RESET_ACTIVITYTN_ADMIN") {
  throw new Error("Définissez RESET_ADMIN_EMAIL, un RESET_ADMIN_PASSWORD de 16 caractères minimum et CONFIRM_ADMIN_PASSWORD_RESET=RESET_ACTIVITYTN_ADMIN.");
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGODB_URI est obligatoire pour réinitialiser le compte admin.");

try {
  await mongoose.connect(mongoUri);
  const admin = await User.findOne({ email, role: "admin" }).select("+password +refreshTokens +activeAccessSessionIds");
  if (!admin) throw new Error("Aucun compte administrateur correspondant trouvé.");

  admin.password = password;
  admin.refreshTokens = [];
  admin.activeAccessSessionIds = [];
  await admin.save();
  await AdminLoginChallenge.deleteMany({ userId: admin._id });
  console.log("Mot de passe administrateur modifié et sessions révoquées.");
} finally {
  await mongoose.disconnect();
}
