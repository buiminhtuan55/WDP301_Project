import bcrypt from "bcryptjs";
import { signAccessToken } from "../utils/jwt.js";
import User from "../models/user.js";

const buildAuthResponse = (user) => {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return {
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      full_name: user.full_name || "",
      role: user.role,
      status: user.status,
    },
  };
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      const err = new Error("username, email, password la bat buoc");
      err.status = 400;
      throw err;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const err = new Error("Email da ton tai");
      err.status = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: String(username).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      full_name: full_name?.trim() || "",
      role: "customer",
    });

    res.status(201).json({
      message: "Dang ky thanh cong",
      ...buildAuthResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("email va password la bat buoc");
      err.status = 400;
      throw err;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      const err = new Error("Email hoac password khong dung");
      err.status = 401;
      throw err;
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      const err = new Error("Email hoac password khong dung");
      err.status = 401;
      throw err;
    }

    if (user.status === "locked" || user.status === "suspended") {
      const err = new Error("Tai khoan dang bi khoa");
      err.status = 403;
      throw err;
    }

    res.json({
      message: "Dang nhap thanh cong",
      ...buildAuthResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res) => {
  res.json({
    user: req.user,
  });
};

export const googleAuthSuccess = async (req, res, next) => {
  try {
    if (!req.user) {
      const err = new Error("Dang nhap Google that bai");
      err.status = 401;
      throw err;
    }

    const { accessToken } = buildAuthResponse(req.user);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUrl = `${frontendUrl}/social-auth-success?token=${encodeURIComponent(accessToken)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};
