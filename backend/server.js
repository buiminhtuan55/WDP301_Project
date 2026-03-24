import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// ===== Core Config & Auth =====
import passport from "passport";
import { connectDB } from "./config/db.js";
import { configurePassport } from "./config/passport.js";
import errorHandler from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";

// ===== Movies & Reviews =====
import publicMovieRoutes from "./routes/publicMovie.routes.js";
import reviewRoutes from "./routes/review.routes.js";

// ===== Theaters, Rooms & Seats =====
import publicRoutes from "./routes/public/public.routes.js";
import roomRoutes from "./routes/room.routes.js";
import seatRoutes from "./routes/seat.routes.js";
import theaterRoutes from "./routes/theater.routes.js";

// ===== Bookings & Payments =====
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

// ===== Showtimes, Combos, AuditLog & Cron =====
import comboRoutes from "./routes/combo.routes.js";
import publicComboRoutes from "./routes/public/publicCombo.routes.js";
import showtimeRoutes from "./routes/showtime.routes.js";

// import "./cron/scheduler.js";
import updateShowtimeStatus from "./cron/showtime.cron.js";

// ===== AI Features =====
import aiRoutes from "./routes/ai.routes.js";
// ===== END AI Features =====

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// ===== Passport Setup =====
configurePassport();
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("CinemaGo Server is RUNNING!");
});

// ===== Auth Routes =====
app.use("/", authRoutes);
app.use("/api", protectedRoutes);

// ===== Movies & Review Routes =====
app.use("/api/movies", publicMovieRoutes);
app.use("/api/reviews", reviewRoutes);

// ===== Theater, Room & Seat Routes =====
app.use("/api/public", publicRoutes);
app.use("/api/theaters", theaterRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/seats", seatRoutes);

// ===== Bookings & Payments Routes =====
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// ===== Showtime, Combo & AuditLog Routes =====
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/combos", comboRoutes);
app.use("/api/combos", publicComboRoutes);

// ===== AI Routes =====
app.use("/api/ai", aiRoutes);
// ===== END AI Routes =====

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB();
  // ===== Cron bootstrap =====
  updateShowtimeStatus();
  console.log(`Server is running on port ${PORT}`);
});
