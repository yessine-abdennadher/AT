import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/activitytn_db");
    console.log(`🇹🇳 [ActivityTN DB] MongoDB connecté avec succès : ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ [ActivityTN DB] Erreur de connexion MongoDB : ${error.message}`);
    process.exit(1);
  }
};
