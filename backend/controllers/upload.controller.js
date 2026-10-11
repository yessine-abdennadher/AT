import * as uploadService from "../services/upload.service.js";

// @desc    Uploader une image (Cloudinary ou local)
// @route   POST /api/upload/image
// @access  Private (Connecté)
export const uploadImage = async (req, res, next) => {
  try {
    const host = req.get("host") || "localhost:5000";
    const result = await uploadService.processImageUpload(req.body, host, req.user);

    res.status(201).json({
      success: true,
      message: "Image uploadée avec succès.",
      url: result.url,
      provider: result.provider,
    });
  } catch (error) {
    next(error);
  }
};
