import { Router } from "express";
import { verifyToken } from "../middlewares/auth.js";
import { getCurrentUser } from "../controllers/auth.controller.js";

const router = Router();

router.get("/me", verifyToken, getCurrentUser);

export default router;
