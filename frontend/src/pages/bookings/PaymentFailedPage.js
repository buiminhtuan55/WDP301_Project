import { Box, Heading, Text, Button, VStack, Icon, Container, Card, CardBody, Badge, Image, HStack, Divider, Grid } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { WarningTwoIcon } from '@chakra-ui/icons';
import { useEffect, useState } from "react";
import apiService from "../../services/apiService";

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get("bookingId");


  const [booking, setBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    if (!bookingId) return;
    
    // GỌI API kiểm tra trạng thái booking/payment để reconcile status từ PayOS (gọi song song để trigger reconcile)
    apiService.get(`/api/payments/booking/${bookingId}/status`, (data, success) => {
      if (success) {
        setPaymentInfo(data.data.paymentInfo);
      }
    });

    // GỌI API lấy chi tiết booking để hiển thị phim + ghế (gọi song song để hiển thị ngay)
    apiService.getById('/api/bookings/', bookingId, (data, ok) => {
      if (ok) {
        console.log("Booking details:", data);
        setBooking(data.booking);
        setSeats(Array.isArray(data.seats) ? data.seats : []);
      } else {
        console.error("Failed to fetch booking details:", data);
        setBooking(null);
        setSeats([]);
      }
    });
  }, [bookingId]);

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
        bg="red.500"
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
        bg="red.600"
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
            bg="linear-gradient(90deg, #f87171, #ef4444)"
            color="white"
            fontWeight="700"
            fontSize="0.8rem"
            w="fit-content"
          >
            THANH TOÁN THẤT BẠI
          </Badge>

          <Box>
            <Heading size="2xl" color="white" mb={2}>
              {params.get("cancel") === "true"
                ? "✗ Giao dịch đã bị hủy"
                : "✗ Thanh toán thất bại"}
            </Heading>
            <Text color="gray.400" fontSize="md">
              {params.get("cancel") === "true"
                ? "Giao dịch đã được hủy theo yêu cầu của bạn. Bạn có thể thử lại thanh toán hoặc quay về trang chủ."
                : "Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau."}
            </Text>
          </Box>
        </VStack>

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
                      <Text color="red.400" fontWeight="bold" fontFamily="mono">
                        {booking.order_code || booking._id}
                      </Text>
                    </HStack>

                    {booking && (
                      <HStack justify="space-between" w="full">
                        <Text color="gray.400">Trạng thái:</Text>
                        <Text color="red.400" fontWeight="bold">
                          {booking.status === 'cancelled' ? 'Đã hủy' : booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'pending' ? 'Chờ thanh toán' : booking.status}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Action Button */}
        <HStack spacing={4} justify="center" mb={8}>
          <Button
            h="50px"
            px={8}
            rounded="full"
            variant="outline"
            color="red.400"
            borderColor="red.400"
            fontWeight="bold"
            onClick={() => {
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
              
              const isStaffRole = role === "lv1" || role === "lv2" || role === "admin";
              
              if (isStaff || isStaffRole) {
                let staffPage = sessionStorage.getItem("staffReturnPage");
                if (!staffPage) {
                  staffPage = localStorage.getItem("staffReturnPage");
                }
                
                if (staffPage) {
                  sessionStorage.removeItem("staffReturnPage");
                  localStorage.removeItem("staffReturnPage");
                  navigate(staffPage);
                } else {
                  const fallbackPage = role === "lv2" ? "/staff/l2" : "/staff/l1";
                  navigate(fallbackPage);
                }
              } else {
                navigate("/");
              }
            }}
            _hover={{
              bg: "rgba(244,63,94,0.1)",
              borderColor: "red.300",
            }}
          >
            {(() => {
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
              const isStaffRole = role === "lv1" || role === "lv2" || role === "admin";
              return isStaff || isStaffRole ? "Quay về trang staff" : "Quay về trang chủ";
            })()}
          </Button>
        </HStack>
      </Container>
    </Box>
  );
};

export default PaymentFailedPage;