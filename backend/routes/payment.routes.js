import { Router } from "express";
import {
  createPaymentLink,
  handlePayosWebhook,
  checkPaymentStatus,
  checkBookingPaymentStatus,
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

router.post("/create-payment-link", verifyToken, createPaymentLink);
router.post("/webhook", handlePayosWebhook);
router.get("/check/:paymentLinkId", checkPaymentStatus);
router.get("/booking/:bookingId/status", verifyToken, checkBookingPaymentStatus);

export default router;
