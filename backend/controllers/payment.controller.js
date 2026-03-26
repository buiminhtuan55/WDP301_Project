import payos from "../utils/payos.js";
import Booking from "../models/booking.js";
import BookingSeat from "../models/bookingSeat.js";
import Showtime from "../models/showtime.js";
import User from "../models/user.js";
import Movie from "../models/movie.js";
import Room from "../models/room.js";
import Theater from "../models/theater.js";
import Seat from "../models/seat.js";
import { sendBookingConfirmationEmail } from "../utils/email.js";

// Helper function to update booking status and handle seat release
const updateBookingStatusAndSeats = async (booking, newStatus, newPaymentStatus, paidAmount = 0, session = null) => {
  const isStatusChanged = booking.status !== newStatus || booking.payment_status !== newPaymentStatus;
  const isPaidAmountChanged = paidAmount > 0 && parseFloat(booking.paid_amount?.toString()) !== paidAmount;

  if (!isStatusChanged && !isPaidAmountChanged) {
    return booking;
  }

  booking.status = newStatus;
  booking.payment_status = newPaymentStatus;
  if (paidAmount > 0) {
    booking.paid_amount = paidAmount;
  }

  if (newStatus === "cancelled" || newStatus === "failed") {
    const bookingSeats = await BookingSeat.find({ booking_id: booking._id }).session(session);
    const seatIdsToRelease = bookingSeats.map(bs => bs.seat_id);

    if (seatIdsToRelease.length > 0) {
      await Showtime.updateOne(
        { _id: booking.showtime_id },
        { $pull: { booked_seats: { $in: seatIdsToRelease } } },
        { session }
      );
      console.log(`Released seats ${seatIdsToRelease} for booking ${booking._id}`);
    }
  }

  await booking.save({ session });
  return booking;
};

export const createPaymentLink = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID la bat buoc" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Khong tim thay booking" });
    }

    if (booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Ban khong co quyen thanh toan cho booking nay" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking khong o trang thai pending" });
    }

    // Kiểm tra booking đã hết hạn chưa
    if (booking.expires_at && new Date() > new Date(booking.expires_at)) {
      return res.status(400).json({ message: "Đơn đặt vé đã hết thời gian thanh toán. Vui lòng đặt lại." });
    }

    // Nếu booking chưa có expires_at (booking cũ), set lại 5 phút
    if (!booking.expires_at) {
      booking.expires_at = new Date(Date.now() + 5 * 60 * 1000);
      await booking.save();
    }

    // Tạo orderCode unique để tránh trùng với lần tạo trước
    const orderCode = Date.now() % 1000000000;
    const amount = Math.round(parseFloat(booking.total_price.toString()));

    const rawDescription = `${bookingId}`;
    const MAX_DESC_LENGTH = 25;
    const description = rawDescription.length > MAX_DESC_LENGTH
      ? rawDescription.slice(0, MAX_DESC_LENGTH - 1) + "…"
      : rawDescription;

    const paymentData = {
      orderCode,
      amount,
      description,
      returnUrl: `${process.env.FRONTEND_URL}/payment-success?bookingId=${bookingId}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment-failed?bookingId=${bookingId}`,
    };

    if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
      throw new Error("PayOS environment variables are not configured correctly.");
    }

    if (typeof payos.createPaymentLink !== "function") {
      throw new TypeError("payos.createPaymentLink is not a function. Check SDK initialization in 'utils/payos.js'.");
    }

    let paymentLink;
    try {
      paymentLink = await payos.createPaymentLink(paymentData);
    } catch (err) {
      const apiErr = err && err.code ? err : (err && err.error) ? err.error : null;
      if (apiErr && (apiErr.code === "20" || apiErr.code === 20)) {
        console.error("PayOS rejected payment creation because description is too long or invalid:", apiErr);
        return res.status(400).json({ message: "Tao link thanh toan that bai: mo ta qua dai hoac khong hop le." });
      }
      throw err;
    }

    await Booking.findByIdAndUpdate(bookingId, {
      order_code: orderCode,
      payment_link_id: paymentLink.paymentLinkId
    });

    res.status(200).json({
      message: "Tao link thanh toan thanh cong",
      data: {
        paymentLink: paymentLink.checkoutUrl,
        paymentLinkId: paymentLink.paymentLinkId,
        orderCode,
        amount
      },
    });
  } catch (error) {
    console.error("Error creating payment link:", error.message);
    if (error instanceof TypeError) {
      console.error("This is likely an issue with the PayOS SDK initialization in 'utils/payos.js'. Please verify the import and constructor call.");
    }
    next(error);
  }
};

export const handlePayosWebhook = async (req, res) => {
  const webhookData = req.body;
  try {
    if (!process.env.PAYOS_CHECKSUM_KEY) {
      throw new Error("PayOS CHECKSUM_KEY is not configured.");
    }

    const verifiedData = payos.verifyPaymentWebhookData(webhookData);
    console.log("Webhook received:", verifiedData);

    const booking = await Booking.findOne({ order_code: verifiedData.orderCode });

    if (!booking) {
      return res.status(200).json({
        success: true,
        message: "Webhook received but booking not found",
      });
    }

    if (booking.status === "confirmed" || booking.status === "cancelled") {
      return res.status(200).json({ success: true, message: "Webhook already processed" });
    }

    switch (verifiedData.code) {
      case "00":
        booking.payment_status = "success";
        booking.status = "confirmed";
        booking.paid_amount = verifiedData.amount;
        await booking.save();

        try {
          const populatedBooking = await Booking.findById(booking._id)
            .populate("user_id", "username email")
            .populate({
              path: "showtime_id",
              populate: [
                { path: "movie_id" },
                {
                  path: "room_id",
                  populate: { path: "theater_id" }
                }
              ]
            });

          const bookingSeats = await BookingSeat.find({ booking_id: booking._id })
            .populate("seat_id");

          await sendBookingConfirmationEmail({
            email: populatedBooking.user_id.email,
            userName: populatedBooking.user_id.username,
            bookingId: populatedBooking._id.toString(),
            movieTitle: populatedBooking.showtime_id.movie_id.title,
            theaterName: populatedBooking.showtime_id.room_id.theater_id.name,
            roomName: populatedBooking.showtime_id.room_id.name,
            showtime: populatedBooking.showtime_id.start_time,
            seats: bookingSeats.map(bs => ({ seat_number: bs.seat_id.seat_number })),
            totalPrice: parseFloat(populatedBooking.total_price.toString()),
            paymentMethod: populatedBooking.payment_method,
            orderCode: populatedBooking.order_code || null
          });
        } catch (emailError) {
          console.error("Failed to send booking confirmation email:", emailError);
        }
        break;

      case "24":
      case "07":
      default:
        if (booking.status === "pending") {
          await updateBookingStatusAndSeats(booking, "cancelled", "failed", 0, null);
        }
        break;
    }

    return res.status(200).json({
      success: true,
      message: "Webhook received successfully",
    });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return res.status(400).json({
      success: false,
      message: "Webhook verification failed",
    });
  }
};

export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { paymentLinkId } = req.params;
    if (!paymentLinkId) {
      return res.status(400).json({ message: "Can cung cap paymentLinkId." });
    }

    const paymentInfo = await payos.getPaymentLinkInformation(paymentLinkId);

    if (!paymentInfo) {
      return res.status(404).json({ message: "Khong tim thay thong tin thanh toan." });
    }

    res.status(200).json({ message: "Lay thong tin thanh cong", data: paymentInfo });
  } catch (error) {
    console.error("Error checking payment status:", error);
    next(error);
  }
};

export const checkBookingPaymentStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: "Can cung cap bookingId." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Khong tim thay booking." });
    }

    const isOwner = booking.user_id.toString() === req.user._id.toString();
    const isStaffOrAdmin = req.user.role === "lv1" || req.user.role === "admin";

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: "Ban khong co quyen xem booking nay." });
    }

    let paymentInfo = null;
    if (booking.payment_link_id) {
      try {
        paymentInfo = await payos.getPaymentLinkInformation(booking.payment_link_id);

        if (booking.status === "pending") {
          if (paymentInfo.status === "PAID") {
            await updateBookingStatusAndSeats(booking, "confirmed", "success", paymentInfo.amountPaid, null);

            try {
              const populatedBooking = await Booking.findById(booking._id)
                .populate("user_id", "username email")
                .populate({
                  path: "showtime_id",
                  populate: [
                    { path: "movie_id" },
                    {
                      path: "room_id",
                      populate: { path: "theater_id" }
                    }
                  ]
                });

              const bookingSeats = await BookingSeat.find({ booking_id: booking._id })
                .populate("seat_id");

              await sendBookingConfirmationEmail({
                email: populatedBooking.user_id.email,
                userName: populatedBooking.user_id.username,
                bookingId: populatedBooking._id.toString(),
                movieTitle: populatedBooking.showtime_id.movie_id.title,
                theaterName: populatedBooking.showtime_id.room_id.theater_id.name,
                roomName: populatedBooking.showtime_id.room_id.name,
                showtime: populatedBooking.showtime_id.start_time,
                seats: bookingSeats.map(bs => ({ seat_number: bs.seat_id.seat_number })),
                totalPrice: parseFloat(populatedBooking.total_price.toString()),
                paymentMethod: populatedBooking.payment_method
              });
            } catch (emailError) {
              console.error("Failed to send booking confirmation email:", emailError);
            }
          } else if (paymentInfo.status === "CANCELLED" || paymentInfo.status === "FAILED") {
            await updateBookingStatusAndSeats(booking, "cancelled", "failed", 0, null);
          }
        }
      } catch (error) {
        console.error("Error getting payment info from PayOS:", error);
      }
    }

    res.status(200).json({
      message: "Lay thong tin thanh cong",
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          payment_status: booking.payment_status,
          payment_method: booking.payment_method,
          total_price: booking.total_price,
          paid_amount: booking.paid_amount,
          order_code: booking.order_code,
          payment_link_id: booking.payment_link_id
        },
        paymentInfo
      }
    });
  } catch (error) {
    console.error("Error checking booking payment status:", error);
    next(error);
  }
};
