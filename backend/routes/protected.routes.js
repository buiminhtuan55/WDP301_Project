import { Router } from "express";
import {
  verifyToken,
  requireAdmin,
  requireStaff,
  requireCustomer,
} from "../middlewares/auth.js";
import { updateUserRole } from "../controllers/auth.controller.js";
import { logAction } from "../utils/logger.js";

// ===== [NGUOI 2] Movies & Reviews =====
// import {
//   createMovie,
//   updateMovie,
//   deleteMovie,
//   updateMovieStatus,
//   getAllMoviesForStaff,
// } from "../controllers/movie.controller.js";
// import {
//   validateCreateMovie,
//   validateUpdateMovie,
//   validateStatusUpdate,
// } from "../middlewares/movieValidation.js";
// import reviewRoutes from "./review.routes.js";
// ===== END [NGUOI 2] =====

// ===== [NGUOI 4] Bookings =====
// import bookingRoutes from "./booking.routes.js";
// ===== END [NGUOI 4] =====

// ===== [NGUOI 5] Combo & Audit =====
// import auditLogRoutes from "./auditLog.routes.js";
// import comboRoutes from "./combo.routes.js";
// ===== END [NGUOI 5] =====

const router = Router();

// ===== [NGUOI 4] Booking Routes =====
// router.use("/bookings", bookingRoutes);
// ===== END [NGUOI 4] =====

// ===== [NGUOI 2] Review Routes =====
// router.use("/reviews", reviewRoutes);
// ===== END [NGUOI 2] =====

// ===== [NGUOI 5] Combo & Audit Routes =====
// router.use("/combos", comboRoutes);
// router.use("/audit-logs", auditLogRoutes);
// ===== END [NGUOI 5] =====

// ===== [NGUOI 1] Profile Routes =====
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Lay thong tin profile thanh cong",
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      fullName: req.user.full_name,
      role: req.user.role,
      status: req.user.status,
    },
  });
});

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { fullName, phone, address, dateOfBirth } = req.body;
    const user = req.user;

    const oldProfile = {
      full_name: user.full_name,
      phone: user.phone,
      address: user.address,
      date_of_birth: user.date_of_birth,
    };

    user.full_name = fullName || user.full_name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.date_of_birth = dateOfBirth || user.date_of_birth;

    const updatedUser = await user.save();

    if (oldProfile.full_name !== updatedUser.full_name) {
      await logAction(
        user.id,
        "User",
        user.id,
        "full_name",
        oldProfile.full_name,
        updatedUser.full_name
      );
    }
    if (oldProfile.phone !== updatedUser.phone) {
      await logAction(
        user.id,
        "User",
        user.id,
        "phone",
        oldProfile.phone,
        updatedUser.phone
      );
    }
    if (oldProfile.address !== updatedUser.address) {
      await logAction(
        user.id,
        "User",
        user.id,
        "address",
        oldProfile.address,
        updatedUser.address
      );
    }
    if (oldProfile.date_of_birth !== updatedUser.date_of_birth) {
      await logAction(
        user.id,
        "User",
        user.id,
        "date_of_birth",
        oldProfile.date_of_birth,
        updatedUser.date_of_birth
      );
    }

    res.json({ message: "Cap nhat profile thanh cong" });
  } catch (err) {
    res.status(500).json({ message: "Loi cap nhat profile" });
  }
});

router.get("/admin/users", verifyToken, requireAdmin, (req, res) => {
  res.json({
    message: "Danh sach tat ca users (chi admin)",
    data: "Day la du lieu nhay cam chi admin moi thay",
  });
});

router.patch(
  "/admin/users/:userId/role",
  verifyToken,
  requireAdmin,
  updateUserRole
);

router.get("/staff/dashboard", verifyToken, requireStaff, (req, res) => {
  res.json({
    message: "Dashboard nhan vien",
    data: "Thong ke doanh thu, phim, ve...",
  });
});

router.get("/customer/bookings", verifyToken, requireCustomer, (req, res) => {
  res.json({
    message: "Lich su dat ve cua ban",
    userId: req.user._id,
    data: "Danh sach ve da dat...",
  });
});

router.get("/test-auth", verifyToken, (req, res) => {
  res.json({
    message: "Ban da dang nhap thanh cong!",
    user: {
      id: req.user._id,
      username: req.user.username,
      role: req.user.role,
    },
  });
});
// ===== END [NGUOI 1] =====

// ===== [NGUOI 2] Protected Movie Routes =====
// router.get("/movies/all", verifyToken, requireStaff, getAllMoviesForStaff);
// router.post("/movies", verifyToken, requireStaff, validateCreateMovie, createMovie);
// router.put("/movies/:id", verifyToken, requireStaff, validateUpdateMovie, updateMovie);
// router.delete("/movies/:id", verifyToken, requireStaff, deleteMovie);
// router.patch(
//   "/movies/:id/status",
//   verifyToken,
//   requireStaff,
//   validateStatusUpdate,
//   updateMovieStatus
// );
// ===== END [NGUOI 2] =====

export default router;