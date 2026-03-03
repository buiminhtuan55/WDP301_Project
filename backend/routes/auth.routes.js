import { Router } from "express";
import passport from "passport";
import {
  googleAuthSuccess,
  login,
  register,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth/google/failed" }),
  googleAuthSuccess
);

router.get("/auth/google/failed", (req, res) => {
  res.status(401).json({ message: "Dang nhap Google that bai" });
});

export default router;
