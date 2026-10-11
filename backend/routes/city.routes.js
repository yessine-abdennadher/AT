import express from "express";
import { getAllCities, createCity, updateCity } from "../controllers/city.controller.js";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllCities);
router.post("/", authenticateToken, requireAdmin, createCity);
router.put("/:id", authenticateToken, requireAdmin, updateCity);

export default router;
