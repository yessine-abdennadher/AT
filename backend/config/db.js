import mongoose from "mongoose";
import { resolveMongoUri } from "./runtimeConfig.js";

export const connectDB = async () => {
  try {
    const mongoUri = resolveMongoUri({ nodeEnv: process.env.NODE_ENV, mongoUri: process.env.MONGODB_URI });
    const conn = await mongoose.connect(mongoUri);
    console.log(`🇹🇳 [ActivityTN DB] MongoDB connecté avec succès : ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ [ActivityTN DB] Erreur de connexion MongoDB : ${error.message}`);
    throw error;
  }
};
