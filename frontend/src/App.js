import { ChakraProvider, Box } from "@chakra-ui/react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";

// ============================================================
// [NGƯỜI 1] Auth & Layout Pages — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import Header from "./pages/Navbar/Header";
// import Footer from "./pages/Navbar/Footer";
// import LoginPage from "./pages/Login";
// import LoginPagetest from "./pages/LoginPagetest";
// import RegisterPage from "./pages/Register";
// import ProfilePage from "./pages/ProfilePage";
// import ChangePasswordPage from "./pages/ChangePasswordPage";
// import ResetPasswordPage from "./pages/ResetPasswordPage";
// import SocialAuthSuccess from "./pages/SocialAuthSuccess";
// import AdminAndStaffLoginPage from "./pages/admin/AdminAndStaffLoginPage";

// ============================================================
// [NGƯỜI 2] Movie Pages — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import HomePage from "./pages/HomePage";
// import AllMoviesPage from "./pages/AllMoviesPage";
// import MovieDetail from "./pages/MovieDetail";
// import MovieManagementPage from "./pages/admin/MovieManagementPage";

// ============================================================
// [NGƯỜI 3] Theater Pages — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import TheatersManagement from "./pages/admin/TheatersManagement";
// import RoomManagement from "./pages/admin/RoomManagementPage";
// import TheaterListPage from "./pages/theaters/TheaterListPage";
// import TheaterDetailPage from "./pages/theaters/TheaterDetailPage";

// ============================================================
// [NGƯỜI 4] Booking & Payment Pages — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import ShowtimeSelection from "./pages/bookings/ShowtimeSelection";
// import SeatSelection from "./pages/bookings/SeatSelection";
// import CartPage from "./pages/bookings/CartCheckoutPage";
// import PaymentSuccessPage from "./pages/bookings/PaymentSuccessPage";
// import PaymentFailedPage from "./pages/bookings/PaymentFailedPage";
// import TicketHistoryPage from "./pages/bookings/TicketHistoryPage";
// import TicketDetailPage from "./pages/bookings/TicketDetailPage";
// import ETicketPage from "./pages/bookings/ETicketPage";
// import BookingCancelledPage from "./pages/bookings/BookingCancelledPage";

// ============================================================
// [NGƯỜI 5] Admin, Staff & Showtime Pages — UNCOMMENT KHI HOÀN THÀNH
// ============================================================
// import DashboardPage from "./pages/admin/DashboardPage";
// import StaffManagementPage from "./pages/admin/StaffManagementPage";
// import CustomerManagementPage from "./pages/admin/CustomerManagementPage";
// import UserDetailPage from "./pages/admin/UserDetailPage";
// import ShowTimeManagementPage from "./pages/admin/ShowTimeManagementPage";
// import BookingManagementPage from "./pages/admin/BookingManagementPage";
// import BookingDetailPage from "./pages/admin/BookingDetailPage";
// import CombosManagement from "./pages/admin/CombosManagement";
// import StaffL1Page from "./pages/staff/StaffL1Page";
// import StaffL2Page from "./pages/staff/StaffL2Page";
// import TicketSeatSelectPage from "./pages/staff/TicketSeatSelectPage";
// import PayOSReturnHandler from "./pages/staff/PayOSReturnHandler";
// import StaffPaymentSuccessPage from "./pages/staff/StaffPaymentSuccessPage";
// import StaffPaymentFailedPage from "./pages/staff/StaffPaymentFailedPage";

// ============================================================
// APP CONTENT — Hiển thị Header/Footer có điều kiện
// ============================================================
function AppContent() {
    const location = useLocation();
    const [shouldHideHeaderFooter, setShouldHideHeaderFooter] = useState(false);

    useEffect(() => {
        // Kiểm tra role từ localStorage
        let roleData = null;
        try {
            roleData = JSON.parse(localStorage.getItem("role"));
        } catch (e) {
            const directRole =
                localStorage.getItem("role") || localStorage.getItem("userRole");
            if (directRole) {
                roleData = { role: directRole };
            }
        }

        const role = roleData?.role || "";
        const isAdmin = role.toLowerCase() === "admin";
        const isStaff =
            role.toLowerCase() === "lv2" || role.toLowerCase() === "lv1";

        // Ẩn Header/Footer cho staff, admin pages và reset-password
        const pathStartsWithStaff = location.pathname.startsWith("/staff/");
        const pathStartsWithAdmin = /^\/admin\//.test(location.pathname);
        const isResetPasswordPage = location.pathname === "/reset-password";
        const isStaffOrAdminRoute =
            pathStartsWithStaff || pathStartsWithAdmin || isResetPasswordPage;

        const isManagementPage =
            location.pathname === "/movies" ||
            location.pathname === "/showtimes" ||
            location.pathname === "/bookings" ||
            location.pathname === "/combos" ||
            (location.pathname.startsWith("/bookings/") &&
                !location.pathname.startsWith("/bookings/cart") &&
                !location.pathname.startsWith("/bookings/showtimes") &&
                !location.pathname.startsWith("/bookings/seats") &&
                !location.pathname.startsWith("/bookings/checkout") &&
                !location.pathname.startsWith("/bookings/cancelled") &&
                !location.pathname.startsWith("/bookings/eticket"));

        const shouldHide =
            isStaffOrAdminRoute || (isManagementPage && (isAdmin || isStaff));

        setShouldHideHeaderFooter(shouldHide);
    }, [location.pathname]);

    return (
        <Box minHeight="100vh" display="flex" flexDirection="column">
            {/* [NGƯỜI 1] Uncomment Header khi hoàn thành */}
            {/* {!shouldHideHeaderFooter && <Header />} */}

            <Box flex="1">
                <Routes>
                    {/* ====== [NGƯỜI 1] Auth & Profile Routes ====== */}
                    {/* <Route path="/login" element={<LoginPage />} /> */}
                    {/* <Route path="/register" element={<RegisterPage />} /> */}
                    {/* <Route path="/admin/login" element={<AdminAndStaffLoginPage />} /> */}
                    {/* <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
                    {/* <Route path="/logintest" element={<LoginPagetest />} /> */}
                    {/* <Route path="/social-auth-success" element={<SocialAuthSuccess />} /> */}
                    {/* <Route path="/profile" element={<ProfilePage />} /> */}
                    {/* <Route path="/change-password" element={<ChangePasswordPage />} /> */}

                    {/* ====== [NGƯỜI 2] Movie Routes ====== */}
                    {/* <Route index element={<HomePage />} /> */}
                    {/* <Route path="/all-movies" element={<AllMoviesPage />} /> */}
                    {/* <Route path="/movies/:id" element={<MovieDetail />} /> */}
                    {/* <Route path="/movies" element={<MovieManagementPage />} /> */}

                    {/* ====== [NGƯỜI 3] Theater Routes ====== */}
                    {/* <Route path="/theaters" element={<TheaterListPage />} /> */}
                    {/* <Route path="/theaters/:id" element={<TheaterDetailPage />} /> */}
                    {/* <Route path="/admin/theaters" element={<TheatersManagement />} /> */}
                    {/* <Route path="/admin/rooms" element={<RoomManagement />} /> */}

                    {/* ====== [NGƯỜI 4] Booking & Payment Routes ====== */}
                    {/* <Route path="/bookings/showtimes/:movieId" element={<ShowtimeSelection />} /> */}
                    {/* <Route path="/bookings/seats/:showtimeId" element={<SeatSelection />} /> */}
                    {/* <Route path="/bookings/checkout/:bookingId" element={<CartPage />} /> */}
                    {/* <Route path="/bookings/cart" element={<CartPage />} /> */}
                    {/* <Route path="/bookings/cancelled" element={<BookingCancelledPage />} /> */}
                    {/* <Route path="/bookings/eticket" element={<ETicketPage />} /> */}
                    {/* <Route path="/payment-success" element={<PaymentSuccessPage />} /> */}
                    {/* <Route path="/payment-failed" element={<PaymentFailedPage />} /> */}
                    {/* <Route path="/ticket-history" element={<TicketHistoryPage />} /> */}
                    {/* <Route path="/ticket-detail/:id" element={<TicketDetailPage />} /> */}

                    {/* ====== [NGƯỜI 5] Admin, Staff & Showtime Routes ====== */}
                    {/* <Route path="/admin/dashboard" element={<DashboardPage />} /> */}
                    {/* <Route path="/admin/staffs" element={<StaffManagementPage />} /> */}
                    {/* <Route path="/admin/customers" element={<CustomerManagementPage />} /> */}
                    {/* <Route path="/admin/user/:id" element={<UserDetailPage />} /> */}
                    {/* <Route path="/showtimes" element={<ShowTimeManagementPage />} /> */}
                    {/* <Route path="/bookings" element={<BookingManagementPage />} /> */}
                    {/* <Route path="/bookings/:id" element={<BookingDetailPage />} /> */}
                    {/* <Route path="/combos" element={<CombosManagement />} /> */}
                    {/* <Route path="/staff/l1" element={<StaffL1Page />} /> */}
                    {/* <Route path="/staff/l2" element={<StaffL2Page />} /> */}
                    {/* <Route path="/staff/ticket" element={<TicketSeatSelectPage />} /> */}
                    {/* <Route path="/staff/payos-return" element={<PayOSReturnHandler />} /> */}
                    {/* <Route path="/staff/payment-success" element={<StaffPaymentSuccessPage />} /> */}
                    {/* <Route path="/staff/payment-failed" element={<StaffPaymentFailedPage />} /> */}

                    {/* ====== 404 Not Found ====== */}
                    <Route path="*" element={<h1>404 - Not Found</h1>} />
                </Routes>
            </Box>

            {/* [NGƯỜI 1] Uncomment Footer khi hoàn thành */}
            {/* {!shouldHideHeaderFooter && <Footer />} */}
        </Box>
    );
}

// ============================================================
// APP ROOT
// ============================================================
function App() {
    return (
        <ChakraProvider>
            <Router>
                <AppContent />
            </Router>
        </ChakraProvider>
    );
}

export default App;