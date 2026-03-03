import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// ===== [NGUOI 1] Core Config & Auth =====
import { connectDB } from "./config/db.js";
import { configurePassport } from "./config/passport.js";
import passport from "passport";
import errorHandler from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
// ===== END [NGUOI 1] =====

// ===== [NGUOI 2] Movies & Reviews =====
// import publicMovieRoutes from "./routes/publicMovie.routes.js";
// import reviewRoutes from "./routes/review.routes.js";
// ===== END [NGUOI 2] =====

// ===== [NGUOI 3] Theaters, Rooms & Seats =====
// import theaterRoutes from "./routes/theater.routes.js";
// import roomRoutes from "./routes/room.routes.js";
// import seatRoutes from "./routes/seat.routes.js";
// import publicRoutes from "./routes/public/public.routes.js";
// ===== END [NGUOI 3] =====

// ===== [NGUOI 4] Bookings & Payments =====
// import bookingRoutes from "./routes/booking.routes.js";
// import paymentRoutes from "./routes/payment.routes.js";
// ===== END [NGUOI 4] =====

// ===== [NGUOI 5] Showtimes, Combos, AuditLog & Cron =====
// import showtimeRoutes from "./routes/showtime.routes.js";
// import comboRoutes from "./routes/combo.routes.js";
// import publicComboRoutes from "./routes/public/publicCombo.routes.js";
// import auditLogRoutes from "./routes/auditLog.routes.js";
// import "./cron/scheduler.js";
// import updateShowtimeStatus from "./cron/showtime.cron.js";
// ===== END [NGUOI 5] =====

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// ===== [NGUOI 1] Passport Setup =====
configurePassport();
app.use(passport.initialize());
// ===== END [NGUOI 1] =====

app.get("/", (req, res) => {
  res.send("CinemaGo Server is RUNNING!");
});

// ===== [NGUOI 1] Auth Routes =====
app.use("/", authRoutes);
app.use("/api", protectedRoutes);
// ===== END [NGUOI 1] =====

// ===== [NGUOI 2] Movie & Review Routes =====
// app.use("/api/movies", publicMovieRoutes);
// app.use("/api/reviews", reviewRoutes);
// ===== END [NGUOI 2] =====

// ===== [NGUOI 3] Theater, Room & Seat Routes =====
// app.use("/api/public", publicRoutes);
// app.use("/api/theaters", theaterRoutes);
// app.use("/api/rooms", roomRoutes);
// app.use("/api/seats", seatRoutes);
// ===== END [NGUOI 3] =====

// ===== [NGUOI 4] Booking & Payment Routes =====
// app.use("/api/bookings", bookingRoutes);
// app.use("/api/payments", paymentRoutes);
// ===== END [NGUOI 4] =====

// ===== [NGUOI 5] Showtime, Combo & AuditLog Routes =====
// app.use("/api/showtimes", showtimeRoutes);
// app.use("/api/combos", comboRoutes);
// app.use("/api/combos", publicComboRoutes);
// app.use("/api/auditlog", auditLogRoutes);
// ===== END [NGUOI 5] =====

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB();
  // ===== [NGUOI 5] Cron bootstrap =====
  // updateShowtimeStatus();
  // ===== END [NGUOI 5] =====
  console.log(`Server is running on port ${PORT}`);
});