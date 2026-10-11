import express from "express";
import { getAllCategories, createCategory, updateCategory } from "../controllers/category.controller.js";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllCategories);
router.post("/", authenticateToken, requireAdmin, createCategory);
router.put("/:id", authenticateToken, requireAdmin, updateCategory);

export default router;
