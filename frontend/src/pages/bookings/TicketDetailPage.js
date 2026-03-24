import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  VStack,
  Divider,
  Alert,
  AlertIcon,
  HStack,
  Badge,
  Container,
  Grid,
  GridItem,
  Flex,
  Icon,
  Image,
  SimpleGrid
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { CalendarIcon, TimeIcon } from "@chakra-ui/icons";
import {
  MdMovie,
  MdChair,
  MdMeetingRoom,
  MdPayments,
  MdLocalMovies
} from "react-icons/md";
import { FaMapMarkerAlt, FaTicketAlt, FaQrcode } from "react-icons/fa";
import apiService from "../../services/apiService";

export default function TicketDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    apiService.getById("/api/bookings/", id, (data, success) => {
      if (success) {
        setBooking(data.booking);
        setSeats(Array.isArray(data.seats) ? data.seats : []);
      } else {
        setError(data?.message || "Không thể tải thông tin chi tiết vé.");
      }
      setLoading(false);
    });
  }, [id]);

  const combos = useMemo(() => {
    const result = [];
    const rawCombos = booking?.combos || [];

    if (Array.isArray(rawCombos) && rawCombos.length > 0) {
      rawCombos.forEach((c) => {
        const comboData = c.combo_id || c.combo || c;
        const name =
          comboData?.name ||
          comboData?.title ||
          c?.name ||
          c?.title ||
          "Combo";
        const quantity = c.quantity || c.qty || c.count || 1;
        result.push({ name, quantity });
      });
    }

    return result;
  }, [booking]);

  const bookingId = booking?.order_code || booking?._id || "";

  const seatText =
    seats.length > 0
      ? seats.map((s) => s.seat_id?.seat_number || s.seat_number).join(", ")
      : "Chưa có thông tin";

  const rawPrice =
    booking?.total_price?.$numberDecimal ??
    booking?.total_price ??
    0;

  const totalPrice = Number(rawPrice || 0).toLocaleString("vi-VN");

  const movie = booking?.showtime_id?.movie_id || {};
  const showtime = booking?.showtime_id || {};
  const room = showtime?.room_id || {};
  const theater = room?.theater_id || {};

  const movieTitle = movie?.title || "Không có tên phim";
  const movieDescription = movie?.description || "Chưa có mô tả phim.";
  const moviePoster =
    movie?.poster_url ||
    movie?.poster ||
    movie?.image ||
    movie?.thumbnail ||
    "";

  const getBookingStatus = (status) => {
    const value = String(status || "").toLowerCase();

    if (["confirmed", "success", "booked", "completed"].includes(value)) {
      return { label: status, colorScheme: "green" };
    }
    if (["pending", "processing"].includes(value)) {
      return { label: status, colorScheme: "yellow" };
    }
    if (["cancelled", "canceled", "failed"].includes(value)) {
      return { label: status, colorScheme: "red" };
    }
    return { label: status || "N/A", colorScheme: "gray" };
  };

  const getPaymentStatus = (status) => {
    const value = String(status || "").toLowerCase();

    if (["paid", "success", "completed"].includes(value)) {
      return { label: status, colorScheme: "green" };
    }
    if (["pending", "unpaid", "processing"].includes(value)) {
      return { label: status, colorScheme: "yellow" };
    }
    if (["failed", "cancelled", "canceled"].includes(value)) {
      return { label: status, colorScheme: "red" };
    }
    return { label: status || "N/A", colorScheme: "gray" };
  };

  const bookingStatus = getBookingStatus(booking?.status);
  const paymentStatus = getPaymentStatus(booking?.payment_status);

  if (loading) {
    return (
      <Center minH="100vh" bg="linear-gradient(180deg, #030712 0%, #08111f 50%, #020617 100%)">
        <VStack spacing={4}>
          <Spinner color="orange.400" size="xl" thickness="4px" />
          <Text color="gray.300">Đang tải chi tiết vé...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg="linear-gradient(180deg, #030712 0%, #08111f 50%, #020617 100%)" py={10}>
        <Alert status="error" my={4} maxW="lg" mx="auto" borderRadius="xl">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  if (!booking) return null;

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #030712 0%, #08111f 45%, #020617 100%)"
      position="relative"
      overflow="hidden"
      py={{ base: 6, md: 10 }}
      px={4}
    >
      <Box
        position="absolute"
        top="-100px"
        left="-100px"
        w="280px"
        h="280px"
        borderRadius="full"
        bg="orange.500"
        opacity={0.08}
        filter="blur(120px)"
      />
      <Box
        position="absolute"
        bottom="-120px"
        right="-100px"
        w="320px"
        h="320px"
        borderRadius="full"
        bg="purple.500"
        opacity={0.08}
        filter="blur(140px)"
      />

      <Container maxW="6xl" position="relative" zIndex={1}>
        <Box
          bg="rgba(10, 14, 24, 0.92)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="30px"
          overflow="hidden"
          boxShadow="0 20px 60px rgba(0,0,0,0.45)"
          backdropFilter="blur(12px)"
        >
          <Box
            px={{ base: 5, md: 8 }}
            py={{ base: 6, md: 7 }}
            bg="linear-gradient(90deg, rgba(249,115,22,0.24) 0%, rgba(168,85,247,0.12) 60%, rgba(255,255,255,0.02) 100%)"
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "flex-start", md: "center" }}
              gap={4}
            >
              <HStack spacing={4}>
                <Flex
                  w="56px"
                  h="56px"
                  borderRadius="xl"
                  bg="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
                  align="center"
                  justify="center"
                  color="white"
                  boxShadow="0 0 24px rgba(249,115,22,0.35)"
                >
                  <Icon as={FaTicketAlt} boxSize={5} />
                </Flex>

                <Box>
                  <Heading size="lg" color="white">
                    Vé điện tử
                  </Heading>
                  <Text color="gray.300" fontSize="sm" mt={1}>
                    Xuất trình mã vé này tại rạp để đối chiếu thông tin
                  </Text>
                </Box>
              </HStack>

              <Box
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="orange.300"
                px={4}
                py={3}
                borderRadius="xl"
                minW={{ base: "full", md: "290px" }}
              >
                <Text fontSize="xs" color="gray.400" mb={1}>
                  Mã đặt vé
                </Text>
                <Text color="orange.300" fontWeight="bold" fontSize="md" wordBreak="break-all">
                  {bookingId}
                </Text>
              </Box>
            </Flex>
          </Box>

          <Grid templateColumns={{ base: "1fr", lg: "340px 1fr" }}>
            {/* Left side */}
            <GridItem
              bg="rgba(255,255,255,0.02)"
              borderRight={{ base: "none", lg: "1px solid" }}
              borderColor="whiteAlpha.100"
            >
              <Box p={{ base: 5, md: 6 }}>
                <VStack spacing={5} align="stretch">
                  <Box
                    borderRadius="2xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    bg="gray.900"
                    h="460px"
                  >
                    {moviePoster ? (
                      <Image
                        src={moviePoster}
                        alt={movieTitle}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                    ) : (
                      <Flex
                        w="100%"
                        h="100%"
                        align="center"
                        justify="center"
                        direction="column"
                        bg="linear-gradient(180deg, #111827 0%, #0f172a 100%)"
                      >
                        <Icon as={MdLocalMovies} boxSize={16} color="orange.300" mb={3} />
                        <Text color="gray.300" fontWeight="semibold">
                          Chưa có poster phim
                        </Text>
                      </Flex>
                    )}
                  </Box>

                  <Box
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    borderRadius="2xl"
                    p={4}
                  >
                    <Text color="gray.400" fontSize="sm" mb={2}>
                      Trạng thái vé
                    </Text>
                    <Badge
                      colorScheme={bookingStatus.colorScheme}
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      fontSize="0.85rem"
                    >
                      {bookingStatus.label}
                    </Badge>

                    <Text color="gray.400" fontSize="sm" mt={4} mb={2}>
                      Trạng thái thanh toán
                    </Text>
                    <Badge
                      colorScheme={paymentStatus.colorScheme}
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      fontSize="0.85rem"
                    >
                      {paymentStatus.label}
                    </Badge>
                  </Box>

                  <Box
                    bg="linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(249,115,22,0.08) 100%)"
                    border="1px dashed"
                    borderColor="orange.300"
                    borderRadius="2xl"
                    p={5}
                    textAlign="center"
                  >
                    <Icon as={FaQrcode} boxSize={16} color="white" mb={3} />
                    <Text color="gray.300" fontSize="sm">
                      Mã kiểm tra vé
                    </Text>
                    <Text color="orange.300" fontWeight="bold" mt={1}>
                      {bookingId}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </GridItem>

            {/* Right side */}
            <GridItem>
              <Box p={{ base: 5, md: 8 }}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Text color="orange.300" fontSize="sm" fontWeight="bold" letterSpacing="0.08em" mb={2}>
                      CINEMAGO E-TICKET
                    </Text>
                    <Heading color="white" size="lg" mb={3}>
                      {movieTitle}
                    </Heading>
                    <Text color="gray.400" lineHeight="1.8">
                      {movieDescription}
                    </Text>
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <InfoCard
                      icon={FaMapMarkerAlt}
                      title="Rạp"
                      value={theater?.name || "N/A"}
                      subValue={theater?.location || ""}
                    />
                    <InfoCard
                      icon={MdMeetingRoom}
                      title="Phòng chiếu"
                      value={room?.name || "N/A"}
                    />
                    <InfoCard
                      icon={CalendarIcon}
                      title="Suất chiếu"
                      value={showtime?.start_time?.vietnamFormatted || "N/A"}
                    />
                    <InfoCard
                      icon={MdChair}
                      title="Ghế ngồi"
                      value={seatText}
                    />
                  </SimpleGrid>

                  {combos.length > 0 && (
                    <Box
                      bg="whiteAlpha.50"
                      border="1px solid"
                      borderColor="whiteAlpha.100"
                      borderRadius="2xl"
                      p={5}
                    >
                      <Text color="purple.300" fontWeight="bold" fontSize="lg" mb={4}>
                        🍿 Combo đã chọn
                      </Text>

                      <VStack align="stretch" spacing={3}>
                        {combos.map((combo, idx) => (
                          <Flex
                            key={idx}
                            justify="space-between"
                            align="center"
                            bg="rgba(255,255,255,0.04)"
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                            p={3}
                            borderRadius="xl"
                          >
                            <Text color="white" fontSize="sm" fontWeight="medium">
                              {combo.name}
                            </Text>
                            <Badge colorScheme="purple" px={2.5} py={1} borderRadius="full">
                              x{combo.quantity}
                            </Badge>
                          </Flex>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  <Box
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    borderRadius="2xl"
                    p={5}
                  >
                    <HStack spacing={3} mb={4}>
                      <Icon as={MdPayments} color="green.300" boxSize={5} />
                      <Text color="green.300" fontWeight="bold" fontSize="lg">
                        Thanh toán
                      </Text>
                    </HStack>

                    <Flex
                      justify="space-between"
                      align={{ base: "flex-start", md: "center" }}
                      direction={{ base: "column", md: "row" }}
                      gap={3}
                    >
                      <Box>
                        <Text color="gray.400" fontSize="sm">
                          Tổng thanh toán
                        </Text>
                        <Text color="orange.300" fontWeight="bold" fontSize="2xl">
                          {totalPrice} ₫
                        </Text>
                      </Box>

                      <Badge
                        colorScheme={paymentStatus.colorScheme}
                        px={3}
                        py={2}
                        borderRadius="full"
                        fontSize="0.85rem"
                      >
                        {paymentStatus.label}
                      </Badge>
                    </Flex>
                  </Box>

                  <Box
                    bg="linear-gradient(90deg, rgba(249,115,22,0.14) 0%, rgba(255,255,255,0.03) 100%)"
                    border="1px solid"
                    borderColor="orange.300"
                    borderRadius="2xl"
                    p={5}
                  >
                    <Text color="orange.200" fontWeight="bold" mb={2}>
                      Lưu ý khi đến rạp
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      <Text color="gray.300" fontSize="sm">
                        • Vui lòng đến trước giờ chiếu khoảng 15 phút.
                      </Text>
                      <Text color="gray.300" fontSize="sm">
                        • Xuất trình mã vé hoặc mã QR tại quầy/kiosk.
                      </Text>
                      <Text color="gray.300" fontSize="sm">
                        • Kiểm tra đúng rạp, phòng chiếu và số ghế trước khi vào phòng.
                      </Text>
                    </VStack>
                  </Box>
                </VStack>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

function InfoCard({ icon, title, value, subValue = "" }) {
  return (
    <Box
      bg="whiteAlpha.50"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={4}
      h="100%"
    >
      <HStack spacing={3} align="flex-start">
        <Flex
          w="42px"
          h="42px"
          borderRadius="xl"
          bg="rgba(249,115,22,0.14)"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={icon} color="orange.300" boxSize={4.5} />
        </Flex>

        <Box>
          <Text color="gray.400" fontSize="sm" mb={1}>
            {title}
          </Text>
          <Text color="white" fontWeight="semibold" lineHeight="1.6">
            {value || "N/A"}
          </Text>
          {subValue ? (
            <Text color="gray.500" fontSize="sm" mt={1}>
              {subValue}
            </Text>
          ) : null}
        </Box>
      </HStack>
    </Box>
  );
}