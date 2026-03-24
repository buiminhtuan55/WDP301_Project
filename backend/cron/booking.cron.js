import cron from 'node-cron';
import Booking from '../models/booking.js';
import BookingSeat from '../models/bookingSeat.js';
import Showtime from '../models/showtime.js';

const BOOKING_EXPIRE_MINUTES = 5;

const cancelExpiredBookings = () => {
  // Chạy mỗi phút
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Tìm các booking pending đã hết hạn
      const expiredBookings = await Booking.find({
        status: 'pending',
        expires_at: { $exists: true, $lte: now }
      });

      if (expiredBookings.length === 0) return;

      console.log(`🕐 Found ${expiredBookings.length} expired pending booking(s). Cancelling...`);

      for (const booking of expiredBookings) {
        try {
          // Cập nhật trạng thái booking
          booking.status = 'cancelled';
          booking.payment_status = 'failed';
          await booking.save();

          // Giải phóng ghế
          const bookingSeats = await BookingSeat.find({ booking_id: booking._id });
          const seatIdsToRelease = bookingSeats.map(bs => bs.seat_id);

          if (seatIdsToRelease.length > 0) {
            await Showtime.updateOne(
              { _id: booking.showtime_id },
              { $pull: { booked_seats: { $in: seatIdsToRelease } } }
            );
          }

          console.log(`✅ Cancelled expired booking ${booking._id} and released ${seatIdsToRelease.length} seat(s)`);
        } catch (err) {
          console.error(`❌ Error cancelling booking ${booking._id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in booking expiry cron:', error.message);
    }
  });

  console.log(`⏰ Booking expiry cron started (${BOOKING_EXPIRE_MINUTES} min timeout)`);
};

export { BOOKING_EXPIRE_MINUTES };
export default cancelExpiredBookings;
