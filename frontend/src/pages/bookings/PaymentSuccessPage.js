
import { Box, Text, VStack, Heading, Button, HStack, Icon, Image, Divider, Badge, Container, Card, CardBody, Spinner, Grid, GridItem } from "@chakra-ui/react";
import { CheckCircleIcon } from '@chakra-ui/icons';
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { keyframes } from "@emotion/react";
import apiService from "../../services/apiService";

const pulse = keyframes`
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
`;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [booking, setBooking] = useState(null);
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("bookingId");
    const cancel = params.get("cancel");
    const status = params.get("status");

    if (id) {
      setBookingId(id);
    } else {
      setError("Không tìm thấy mã đặt vé.");
      return;
    }

    // Immediately redirect if the URL indicates a cancelled payment
    if (cancel === "true" || status === "CANCELLED") {
      // Kiểm tra nếu là staff thì redirect về staff payment-failed
      const isStaff = localStorage.getItem("isStaff") === "true";
      let role = (localStorage.getItem("userRole") || "").toLowerCase();
      if (!role) {
        try {
          const roleData = JSON.parse(localStorage.getItem("role"));
          role = (roleData?.role || "").toLowerCase();
        } catch (e) {
          // Ignore
        }
      }
      const isStaffRole = role === "lv1" || role === "admin";
      
      if (isStaff || isStaffRole) {
        navigate(`/staff/payment-failed?bookingId=${id}&cancel=true`);
      } else {
        navigate(`/payment-failed?bookingId=${id}&cancel=true`);
      }
      return;
    }

    // Kiểm tra nếu là staff thì redirect về staff payment-success
    const isStaff = localStorage.getItem("isStaff") === "true";
    let role = (localStorage.getItem("userRole") || "").toLowerCase();
    if (!role) {
      try {
        const roleData = JSON.parse(localStorage.getItem("role"));
        role = (roleData?.role || "").toLowerCase();
      } catch (e) {
        // Ignore
      }
    }
    const isStaffRole = role === "lv1" || role === "admin";
    
    if (isStaff || isStaffRole) {
      // Redirect về staff payment-success page
      navigate(`/staff/payment-success?bookingId=${id}${status ? `&status=${status}` : ''}`, { replace: true });
      return;
    }
  }, [location.search, navigate]);

  // Effect để lấy booking details
  useEffect(() => {
    if (!bookingId) return;

    apiService.getById('/api/bookings/', bookingId, (data, ok) => {
      if (ok) {
        console.log("Booking details:", data);
        const bookingData = data.booking;
        setBooking(bookingData);
        setSeats(Array.isArray(data.seats) ? data.seats : []);
        
        // Kiểm tra và cập nhật status từ booking ngay lập tức
        if (bookingData?.status === "confirmed" || 
            bookingData?.payment_status === "success" || 
            bookingData?.payment_status === "paid") {
          setStatus("confirmed");
        } else if (bookingData?.status) {
          setStatus(bookingData.status);
        }
      } else {
        console.error("Failed to fetch booking details:", data);
        setBooking(null);
        setSeats([]);
      }
    });
  }, [bookingId]);

  // Effect để check payment status
  useEffect(() => {
    if (!bookingId) return;
    if (status === "confirmed") return; // Không cần check nếu đã confirmed

    let interval = null;
    let reloadTimeout = null;

    const checkPaymentStatus = () => {
      apiService.get(
        `/api/payments/booking/${bookingId}/status`,
        (data, success) => {
          if (success && data?.data) {
            const bookingData = data.data.booking;
            const paymentInfo = data.data.paymentInfo;
            const bookingStatus = bookingData?.status;
            const paymentStatus = bookingData?.payment_status;

            console.log("Payment status check:", { bookingStatus, paymentStatus, paymentInfoStatus: paymentInfo?.status });

            // Kiểm tra nếu booking đã được confirmed hoặc payment đã success/paid
            if (
              bookingStatus === "confirmed" || 
              paymentStatus === "success" ||
              paymentStatus === "paid" ||
              (paymentInfo && paymentInfo.status === 'PAID')
            ) {
              setStatus("confirmed");
              // Reload booking details để có thông tin mới nhất
              apiService.getById('/api/bookings/', bookingId, (data, ok) => {
                if (ok) {
                  setBooking(data.booking);
                  setSeats(Array.isArray(data.seats) ? data.seats : []);
                }
              });
              if (interval) clearInterval(interval);
              if (reloadTimeout) clearTimeout(reloadTimeout);
              return;
            }

            // Kiểm tra nếu booking bị cancelled hoặc payment failed/cancelled
            if (
              bookingStatus === "cancelled" ||
              paymentStatus === "failed" ||
              paymentStatus === "cancelled" ||
              (paymentInfo && (paymentInfo.status === 'CANCELLED' || paymentInfo.status === 'FAILED'))
            ) {
              setStatus("cancelled");
              if (interval) clearInterval(interval);
              if (reloadTimeout) clearTimeout(reloadTimeout);
              navigate(`/payment-failed?bookingId=${bookingId}`);
              return;
            }

            // Cập nhật status hiển thị
            if (bookingStatus) {
              setStatus(bookingStatus);
            }
          } else {
            const errorMsg = data?.message || "Lỗi khi kiểm tra trạng thái thanh toán.";
            console.error("Payment status check error:", errorMsg);
            // Chỉ set error nếu chưa có booking data
            if (!booking) {
              setError(errorMsg);
            }
            if (interval) clearInterval(interval);
          }
        }
      );
    };

    // Check ngay lập tức khi component mount
    checkPaymentStatus();

    // Sau đó check định kỳ mỗi 1.5 giây để phản hồi nhanh hơn
    interval = setInterval(checkPaymentStatus, 1500);

    // Reload trang sau 5 giây nếu vẫn chưa confirmed hoặc cancelled
    reloadTimeout = setTimeout(() => {
      if (status === "pending" || (!status || status === "")) {
        console.log("Payment status still pending after 5s, reloading page...");
        window.location.reload();
      }
    }, 5000);

    // Cleanup interval và timeout on component unmount
    return () => {
      if (interval) clearInterval(interval);
      if (reloadTimeout) clearTimeout(reloadTimeout);
    };
  }, [bookingId, navigate, status, booking]);

  return (
    <Box 
      bg="linear-gradient(180deg, #070b14 0%, #0f172a 55%, #111827 100%)"
      minH="100vh" 
      color="white"
      py={10}
      position="relative"
      overflow="hidden"
    >
      {/* Background effects */}
      <Box
        position="absolute"
        top="-120px"
        left="-120px"
        w="340px"
        h="340px"
        bg="orange.400"
        opacity={0.08}
        borderRadius="full"
        filter="blur(120px)"
      />
      <Box
        position="absolute"
        bottom="-140px"
        right="-120px"
        w="380px"
        h="380px"
        bg="red.500"
        opacity={0.08}
        borderRadius="full"
        filter="blur(140px)"
      />

      <Container maxW="1200px" position="relative" zIndex={2}>
        {/* Header Section */}
        <VStack align="start" spacing={6} mb={8}>
          <Badge
            px={4}
            py={2}
            rounded="full"
            bg="linear-gradient(90deg, #fb923c, #f97316)"
            color="white"
            fontWeight="700"
            fontSize="0.8rem"
            w="fit-content"
          >
            CINEMAGO PREMIUM EXPERIENCE
          </Badge>

          <Box>
            <Heading size="2xl" color="white" mb={2}>
              {status === "confirmed" ? "✓ Thanh toán thành công!" : status === "pending" ? "Đang xác nhận thanh toán..." : "Lỗi xư lý thanh toán"}
            </Heading>
            <Text color="gray.400" fontSize="md">
              {status === "confirmed" 
                ? "Cảm ơn bạn đã đặt vé. Vé của bạn đã được xác nhận."
                : status === "pending"
                ? "Vui lòng chờ chút, chúng tôi đang xác nhận thanh toán của bạn."
                : "Có lỗi xảy ra, vui lòng thử lại."}
            </Text>
          </Box>
        </VStack>

        {/* Loading State */}
        {status === "pending" && (
          <Card
            bg="rgba(12,18,35,0.88)"
            border="1px solid rgba(255,255,255,0.08)"
            rounded="24px"
            boxShadow="0 18px 50px rgba(0,0,0,0.25)"
            mb={8}
          >
            <CardBody p={8} textAlign="center">
              <VStack spacing={6}>
                <HStack spacing={2} justify="center">
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg="orange.400"
                    css={{
                      animation: `${pulse} 1.4s ease-in-out infinite`
                    }}
                  />
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg="orange.400"
                    css={{
                      animation: `${pulse} 1.4s ease-in-out infinite 0.2s`
                    }}
                  />
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg="orange.400"
                    css={{
                      animation: `${pulse} 1.4s ease-in-out infinite 0.4s`
                    }}
                  />
                </HStack>
                <Text color="gray.300">Đang xác nhận thanh toán của bạn...</Text>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Error State */}
        {error && !booking && (
          <Card
            bg="rgba(239,68,68,0.15)"
            border="1px solid rgba(239,68,68,0.3)"
            rounded="24px"
            mb={8}
          >
            <CardBody p={6}>
              <VStack spacing={4} align="start">
                <Heading size="md" color="red.400">{error}</Heading>
                <Button
                  colorScheme="orange"
                  onClick={() => navigate("/")}
                >
                  Quay về trang chủ
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Booking Details Card */}
        {booking && booking.showtime_id && (
          <Card
            bg="rgba(12,18,35,0.88)"
            border="1px solid rgba(255,255,255,0.08)"
            rounded="24px"
            boxShadow="0 18px 50px rgba(0,0,0,0.25)"
            mb={8}
          >
            <CardBody p={6}>
              <VStack align="stretch" spacing={6}>
                <HStack align="start" spacing={6}>
                  {/* Movie Poster */}
                  {booking.showtime_id.movie_id?.poster_url && (
                    <Image
                      src={booking.showtime_id.movie_id.poster_url}
                      alt={booking.showtime_id.movie_id?.title || 'Poster'}
                      boxSize={{ base: "120px", md: "150px" }}
                      objectFit="cover"
                      borderRadius="12px"
                      border="1px solid rgba(255,255,255,0.1)"
                    />
                  )}

                  {/* Booking Info */}
                  <VStack align="start" spacing={3} flex="1">
                    <Heading as="h3" size="md" color="white">
                      {booking.showtime_id.movie_id?.title}
                    </Heading>

                    {!!booking.showtime_id.movie_id?.genre?.length && (
                      <HStack spacing={2} flexWrap="wrap">
                        {booking.showtime_id.movie_id.genre.slice(0, 3).map((g, idx) => (
                          <Badge
                            key={idx}
                            px={3}
                            py={1}
                            rounded="full"
                            bg="whiteAlpha.200"
                            color="white"
                            fontWeight="500"
                            fontSize="xs"
                          >
                            {g}
                          </Badge>
                        ))}
                      </HStack>
                    )}

                    <Divider borderColor="whiteAlpha.200" my={2} />

                    <Grid templateColumns="1fr 1fr" gap={3} w="full" fontSize="sm">
                      <Box>
                        <Text color="gray.400">Rạp</Text>
                        <Text color="white" fontWeight="500">{booking.showtime_id.room_id?.theater_id?.name}</Text>
                      </Box>
                      <Box>
                        <Text color="gray.400">Phòng chiếu</Text>
                        <Text color="white" fontWeight="500">{booking.showtime_id.room_id?.name}</Text>
                      </Box>
                      <Box>
                        <Text color="gray.400">Suất chiếu</Text>
                        <Text color="white" fontWeight="500">
                          {booking.showtime_id.start_time?.vietnamFormatted || new Date(booking.showtime_id.start_time?.vietnam || booking.showtime_id.start_time).toLocaleString('vi-VN')}
                        </Text>
                      </Box>
                      <Box>
                        <Text color="gray.400">Ghế</Text>
                        <Text color="white" fontWeight="500">
                          {seats.map(s => s.seat_id?.seat_number || s.seat_number).join(', ')}
                        </Text>
                      </Box>
                    </Grid>

                    <Divider borderColor="whiteAlpha.200" my={2} />

                    <HStack justify="space-between" w="full">
                      <Text color="gray.400">Mã đặt vé:</Text>
                      <Text color="orange.300" fontWeight="bold" fontFamily="mono">
                        {booking.order_code || booking._id}
                      </Text>
                    </HStack>

                    <HStack justify="space-between" w="full">
                      <Text color="gray.400">Tổng tiền:</Text>
                      <Text color="orange.300" fontWeight="bold" fontSize="lg">
                        {booking.total_price ? parseFloat(booking.total_price.$numberDecimal || booking.total_price).toLocaleString("vi-VN") : "0"}đ
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Action Buttons */}
        <HStack spacing={4} justify="center" mb={8}>
          <Button
            h="50px"
            px={8}
            rounded="full"
            bg="linear-gradient(90deg, #f59e0b, #f97316)"
            color="white"
            fontWeight="bold"
            onClick={() => navigate("/ticket-history")}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "0 14px 28px rgba(249,115,22,0.28)",
            }}
          >
            Xem lịch sử đặt vé
          </Button>
          <Button
            h="50px"
            px={8}
            rounded="full"
            variant="outline"
            color="white"
            borderColor="whiteAlpha.300"
            _hover={{
              bg: "whiteAlpha.100",
              borderColor: "whiteAlpha.400",
            }}
            onClick={() => navigate("/")}
          >
            Quay về trang chủ
          </Button>
        </HStack>
      </Container>
    </Box>
  );
};

export default PaymentSuccessPage;
