import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
// ============================================================
// [NGƯỜI 1] Core Config & Auth — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import { connectDB } from "./config/db.js";
// import { configurePassport } from "./config/passport.js";
// import passport from "passport";
// import errorHandler from "./middlewares/errorHandler.js";
// import authRoutes from "./routes/auth.routes.js";
// import protectedRoutes from "./routes/protected.routes.js";

// ============================================================
// [NGƯỜI 2] Movies & Reviews — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import publicMovieRoutes from "./routes/publicMovie.routes.js";
// import reviewRoutes from "./routes/review.routes.js";

// ============================================================
// [NGƯỜI 3] Theaters, Rooms & Seats — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import theaterRoutes from "./routes/theater.routes.js";
// import roomRoutes from "./routes/room.routes.js";
// import seatRoutes from "./routes/seat.routes.js";
// import publicRoutes from "./routes/public/public.routes.js";

// ============================================================
// [NGƯỜI 4] Bookings & Payments — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import paymentRoutes from "./routes/payment.routes.js";

// ============================================================
// [NGƯỜI 5] Showtimes, Combos, AuditLog & Cron — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import showtimeRoutes from "./routes/showtime.routes.js";
// import comboRoutes from "./routes/combo.routes.js";
// import publicComboRoutes from "./routes/public/publicCombo.routes.js";
// import auditLogRoutes from "./routes/auditLog.routes.js";
// import './cron/scheduler.js';
// import updateShowtimeStatus from "./cron/showtime.cron.js";

// ============================================================
// APP SETUP
// ============================================================
dotenv.config();

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        credentials: true,
    })
);

// [NGƯỜI 1] Uncomment 2 dòng dưới khi hoàn thành passport config
// configurePassport();
// app.use(passport.initialize());

// ============================================================
// ROUTES
// ============================================================

// Root route — kiểm tra server hoạt động
app.get("/", (req, res) => {
    res.send("CinemaGo Server is RUNNING! 🎬");
});

// ------ [NGƯỜI 1] Auth Routes ------
// app.use("/", authRoutes);                        // Public auth routes (register, login, forgot-password...)
// app.use("/api", protectedRoutes);                // Protected routes (cần JWT)

// ------ [NGƯỜI 2] Movie & Review Routes ------
// app.use("/api/movies", publicMovieRoutes);       // Public movie routes (xem phim, tìm kiếm)
// app.use("/api/reviews", reviewRoutes);           // Review routes

// ------ [NGƯỜI 3] Theater, Room & Seat Routes ------
// app.use("/api/public", publicRoutes);            // Public theaters/rooms/seats
// app.use("/api/theaters", theaterRoutes);         // Theater management (admin)
// app.use("/api/rooms", roomRoutes);               // Room management (admin)
// app.use("/api/seats", seatRoutes);               // Seat management (admin)

// ------ [NGƯỜI 4] Booking & Payment Routes ------
// app.use("/api/payments", paymentRoutes);         // Payment routes (PayOS)

// ------ [NGƯỜI 5] Showtime, Combo & AuditLog Routes ------
// app.use("/api/showtimes", showtimeRoutes);       // Showtime management
// app.use("/api/combos", comboRoutes);             // Staff/Admin combo management
// app.use("/api/combos", publicComboRoutes);       // Public combo routes
// app.use("/api/auditlog", auditLogRoutes);        // Audit log routes

// ============================================================
// ERROR HANDLER (luôn để cuối cùng)
// ============================================================
// [NGƯỜI 1] Uncomment dòng dưới khi hoàn thành errorHandler middleware
// app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    // [NGƯỜI 1] Uncomment dòng dưới khi hoàn thành db config
    connectDB();

    // [NGƯỜI 5] Uncomment dòng dưới khi hoàn thành cron jobs
    // updateShowtimeStatus();

    console.log(`Server is running on port ${PORT}`);
});
