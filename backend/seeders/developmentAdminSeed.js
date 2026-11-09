import dotenv from "dotenv";

dotenv.config();

export const getDevelopmentAdminSeed = () => {
  if (process.env.NODE_ENV !== "development") return null;

  const email = String(process.env.DEV_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.DEV_ADMIN_PASSWORD || "");
  if (!email && !password) return null;
  if (!email || password.length < 16) {
    throw new Error("Configurez DEV_ADMIN_EMAIL et un DEV_ADMIN_PASSWORD de 16 caractères minimum pour créer le compte admin local.");
  }

  return {
    name: "Administrateur ActivityTN",
    email,
    password,
    role: "admin",
    city: "Sfax",
    bio: "Compte administrateur de développement.",
  };
};
