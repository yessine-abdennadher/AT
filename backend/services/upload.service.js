import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// S'assurer que le dossier uploads existe
async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error("[UploadService] Erreur création dossier uploads:", err.message);
  }
}
ensureUploadsDir();

/**
 * Upload vers Cloudinary via API REST directe (ne nécessite pas de dépendance native externe)
 */
async function uploadToCloudinary(base64Data, folder = "tfarhida") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null; // Cloudinary non configuré
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new URLSearchParams();
  formData.append("file", base64Data);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn("[UploadService] Échec Cloudinary REST:", errorText);
    return null;
  }

  const result = await response.json();
  let optimizedUrl = result.secure_url || result.url;
  // Injection automatique de f_auto,q_auto pour compression intelligente et format moderne (WebP/AVIF)
  if (optimizedUrl && optimizedUrl.includes("/upload/")) {
    optimizedUrl = optimizedUrl.replace("/upload/", "/upload/f_auto,q_auto/");
  }

  return {
    url: optimizedUrl,
    publicId: result.public_id,
    provider: "cloudinary",
  };
}

/**
 * Sauvegarde locale dans le dossier backend/uploads/
 */
async function saveLocally(base64Data, reqHost, folder = "activities") {
  await ensureUploadsDir();

  // Extraction du type MIME et des données brutes
  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  let ext = "jpg";
  let buffer;

  if (matches) {
    const rawExt = matches[1].toLowerCase();
    ext = rawExt === "jpeg" ? "jpg" : rawExt;
    buffer = Buffer.from(matches[2], "base64");
  } else {
    // Si c'est directement une chaîne base64 sans en-tête data URI
    buffer = Buffer.from(base64Data, "base64");
  }

  // Liste blanche stricte d'extensions d'images (blocage des SVG exécutables, HTML ou binaires)
  const ALLOWED_EXTENSIONS = ["jpg", "png", "webp"];
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error("Format d'image non autorisé. Formats acceptés : JPG, PNG, WEBP.");
    error.statusCode = 400;
    throw error;
  }

  // Vérification de taille (5 Mo max)
  const maxSize = 5 * 1024 * 1024;
  if (buffer.length > maxSize) {
    const error = new Error("L'image dépasse la taille maximale autorisée (5 Mo).");
    error.statusCode = 400;
    throw error;
  }

  // Nettoyage strict du nom de dossier contre les traversées de répertoire
  const sanitizedFolder = String(folder || "activities").replace(/[^a-zA-Z0-9_-]/g, "");
  const uniqueId = crypto.randomUUID();
  const filename = `${sanitizedFolder}-${uniqueId}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.writeFile(filePath, buffer);

  // Construction de l'URL publique
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const url = `${protocol}://${reqHost}/uploads/${filename}`;

  return {
    url,
    filename,
    provider: "local",
  };
}

/**
 * Point d'entrée principal pour traiter l'upload d'image
 */
export async function processImageUpload(data, reqHost, user) {
  const { image, folder = "activities" } = data;

  if (!image || typeof image !== "string") {
    const error = new Error("Aucune image valide fournie en base64.");
    error.statusCode = 400;
    throw error;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
  );

  if (isProduction && !hasCloudinaryConfig) {
    const error = new Error("Le service Cloudinary est obligatoire en production mais n'est pas configuré.");
    error.statusCode = 503;
    throw error;
  }

  // 1. Tenter l'upload Cloudinary si configuré
  if (hasCloudinaryConfig) {
    try {
      const cloudinaryResult = await uploadToCloudinary(image, `tfarhida/${folder}`);
      if (cloudinaryResult) {
        console.log(`[UploadService] ✅ Image uploadée sur Cloudinary par ${user?.email || 'anonyme'}: ${cloudinaryResult.url}`);
        return cloudinaryResult;
      }
      if (isProduction) {
        const error = new Error("Échec de l'upload Cloudinary en production.");
        error.statusCode = 502;
        throw error;
      }
    } catch (cloudErr) {
      if (isProduction) {
        throw cloudErr;
      }
      console.warn("[UploadService] Erreur Cloudinary, basculement local :", cloudErr.message);
    }
  }

  // 2. Basculement sur stockage local sécurisé en développement
  const localResult = await saveLocally(image, reqHost, folder);
  console.log(`[UploadService] 💾 Image stockée localement par ${user?.email || 'anonyme'}: ${localResult.url}`);
  return localResult;
}
