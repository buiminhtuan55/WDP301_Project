import { Box, ChakraProvider } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";

// ===== Auth & Layout Pages =====
import ChangePasswordPage from "./pages/ChangePasswordPage";
import LoginPage from "./pages/Login";
import LoginPagetest from "./pages/LoginPagetest";
import Footer from "./pages/Navbar/Footer";
import Header from "./pages/Navbar/Header";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/Register";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SocialAuthSuccess from "./pages/SocialAuthSuccess";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import CustomerManagementPage from "./pages/admin/CustomerManagementPage";

// ===== Movie Pages =====
import AllMoviesPage from "./pages/AllMoviesPage";
import HomePage from "./pages/HomePage";
import MovieDetail from "./pages/MovieDetail";

// ===== Theater Pages =====
import RoomManagement from "./pages/admin/RoomManagementPage";
import TheatersManagement from "./pages/admin/TheatersManagement";
import TheaterDetailPage from "./pages/theaters/TheaterDetailPage";
import TheaterListPage from "./pages/theaters/TheaterListPage";

// ===== Booking & Payment Pages =====
import BookingCancelledPage from "./pages/bookings/BookingCancelledPage";
import CartPage from "./pages/bookings/CartCheckoutPage";
import ETicketPage from "./pages/bookings/ETicketPage";
import PaymentFailedPage from "./pages/bookings/PaymentFailedPage";
import PaymentSuccessPage from "./pages/bookings/PaymentSuccessPage";
import SeatSelection from "./pages/bookings/SeatSelection";
import ShowtimeSelection from "./pages/bookings/ShowtimeSelection";
import TicketDetailPage from "./pages/bookings/TicketDetailPage";
import TicketHistoryPage from "./pages/bookings/TicketHistoryPage";

// ===== Admin, Staff & Showtime Pages =====
import BookingDetailPage from "./pages/admin/BookingDetailPage";
import BookingManagementPage from "./pages/admin/BookingManagementPage";
import CombosManagement from "./pages/admin/CombosManagement";
import DashboardPage from "./pages/admin/DashboardPage";
import MovieManagementPage from "./pages/admin/MovieManagementPage";
import ShowtimeManagementPage from "./pages/admin/ShowTimeManagementPage";
import StaffManagementPage from "./pages/admin/StaffManagementPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import PayOSReturnHandler from "./pages/staff/PayOSReturnHandler";
import StaffL1Page from "./pages/staff/StaffL1Page";
import StaffL2Page from "./pages/staff/StaffL2Page";
import StaffProfilePage from "./pages/staff/StaffProfilePage";
import StaffPaymentFailedPage from "./pages/staff/StaffPaymentFailedPage";
import StaffPaymentSuccessPage from "./pages/staff/StaffPaymentSuccessPage";
import TicketSeatSelectPage from "./pages/staff/TicketSeatSelectPage";

// ===== AI Components =====
import Chatbot from "./components/Chatbot";
// ===== END AI Components =====

function AppContent() {
  const location = useLocation();
  const [shouldHideHeaderFooter, setShouldHideHeaderFooter] = useState(false);

  useEffect(() => {
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

    const pathStartsWithStaff = location.pathname.startsWith("/staff/");
    const pathStartsWithAdmin = /^\/admin\//.test(location.pathname);

    const hiddenAuthRoutes = [
      "/login",
      "/register",
      "/reset-password",
      "/admin/login",
      "/logintest",
      "/verify-email",
    ];
    const isHiddenAuthRoute = hiddenAuthRoutes.includes(location.pathname);

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
      isHiddenAuthRoute ||
      pathStartsWithStaff ||
      pathStartsWithAdmin ||
      (isManagementPage && (isAdmin || isStaff));

    setShouldHideHeaderFooter(shouldHide);
  }, [location.pathname]);

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      {!shouldHideHeaderFooter && <Header />}

      <Box flex="1">
        <Routes>
          {/* ===== Auth & Profile Routes ===== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/logintest" element={<LoginPagetest />} />
          <Route path="/social-auth-success" element={<SocialAuthSuccess />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          {/* ========== */}

          {/* ===== Movie Routes ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/all-movies" element={<AllMoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/movies" element={<MovieManagementPage />} />
          {/* ========== */}

          {/* ===== Theater Routes ===== */}
          <Route path="/theaters" element={<TheaterListPage />} />
          <Route path="/theaters/:id" element={<TheaterDetailPage />} />
          <Route path="/admin/theaters" element={<TheatersManagement />} />
          <Route path="/admin/rooms" element={<RoomManagement />} />
          {/* ========== */}

          {/* ===== Booking & Payment Routes ===== */}
          <Route
            path="/bookings/showtimes/:movieId"
            element={<ShowtimeSelection />}
          />
          <Route
            path="/bookings/seats/:showtimeId"
            element={<SeatSelection />}
          />
          <Route
            path="/bookings/checkout/:bookingId"
            element={<CartPage />}
          />
          <Route path="/bookings/cart" element={<CartPage />} />
          <Route
            path="/bookings/cancelled"
            element={<BookingCancelledPage />}
          />
          <Route
            path="/bookings/eticket/:bookingId"
            element={<ETicketPage />}
          />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-failed" element={<PaymentFailedPage />} />
          <Route path="/ticket-history" element={<TicketHistoryPage />} />
          <Route path="/ticket-detail/:id" element={<TicketDetailPage />} />
          {/* ========== */}

          {/* ===== Admin, Staff & Showtime Routes ===== */}
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/staffs" element={<StaffManagementPage />} />
          <Route path="/admin/customers" element={<CustomerManagementPage />} />
          <Route path="/admin/user/:id" element={<UserDetailPage />} />
          <Route path="/showtimes" element={<ShowtimeManagementPage />} />
          <Route path="/bookings" element={<BookingManagementPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/combos" element={<CombosManagement />} />
          <Route path="/staff/l1" element={<StaffL1Page />} />
          <Route path="/staff/l2" element={<StaffL2Page />} />
          <Route path="/staff/profile" element={<StaffProfilePage />} />
          <Route path="/staff/ticket" element={<TicketSeatSelectPage />} />
          <Route path="/staff/payos-return" element={<PayOSReturnHandler />} />
          <Route
            path="/staff/payment-success"
            element={<StaffPaymentSuccessPage />}
          />
          <Route
            path="/staff/payment-failed"
            element={<StaffPaymentFailedPage />}
          />
          {/* ========== */}

          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
      </Box>

      {!shouldHideHeaderFooter && <Footer />}
      {!shouldHideHeaderFooter && <Chatbot />}
    </Box>
  );
}

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
