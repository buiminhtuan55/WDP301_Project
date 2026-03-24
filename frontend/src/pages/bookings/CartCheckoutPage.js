import {
  Box,
  Button,
  Heading,
  useToast,
  Text,
  VStack,
  Spinner,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Image,
  HStack,
  Divider,
  Badge,
  Container,
  Card,
  CardBody,
  SimpleGrid,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import apiService from "../../services/apiService";

const CartCheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const [booking, setBooking] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError("Không tìm thấy mã đặt vé.");
      setLoading(false);
      return;
    }

    apiService.getById("/api/bookings/", bookingId, (data, success) => {
      if (success) {
        if (data.booking.status !== "pending") {
          toast({
            title: "Giao dịch đã hoàn tất",
            description: `Vé này đã được ${
              data.booking.status === "confirmed"
                ? "xác nhận thanh toán"
                : "hủy"
            }. Bạn sẽ được chuyển về trang lịch sử.`,
            status: "info",
            duration: 5000,
            isClosable: true,
          });
          setTimeout(() => navigate("/bookings/history"), 3000);
        } else {
          setBooking(data.booking);
          setSeats(data.seats);
        }
      } else {
        setError(data.message || "Không thể tải thông tin đặt vé.");
      }
      setLoading(false);
    });
  }, [bookingId, navigate, toast]);

  const handleCheckout = async () => {
    setIsProcessingPayment(true);
    setError("");

    try {
      const paymentLinkRes = await new Promise((resolve) => {
        apiService.post(
          "/api/payments/create-payment-link",
          { bookingId },
          (data, success) => {
            resolve({ data, success });
          }
        );
      });

      if (!paymentLinkRes.success) {
        throw new Error(
          paymentLinkRes.data?.message || "Tạo link thanh toán thất bại"
        );
      }

      const paymentUrl = paymentLinkRes.data?.data?.paymentLink;
      if (!paymentUrl) {
        throw new Error("Không nhận được link thanh toán");
      }

      window.location.href = paymentUrl;
    } catch (err) {
      setError(err.message);
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsProcessingPayment(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    apiService.put(`/api/bookings/${bookingId}/cancel`, {}, (data, success) => {
      setIsCancelling(false);
      onClose();

      if (success) {
        toast({
          title: "Thành công",
          description: "Đã hủy đặt vé thành công.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/bookings/cancelled");
      } else {
        toast({
          title: "Lỗi",
          description: data.message || "Không thể hủy đặt vé.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  if (loading) {
    return (
      <Box bg="#050814" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner color="orange.400" size="xl" thickness="4px" />
          <Text color="gray.400">Đang tải thông tin thanh toán...</Text>
        </VStack>
      </Box>
    );
  }

  if (error || !booking) {
    return (
      <Box bg="#050814" minH="100vh" position="relative" overflow="hidden" py={16}>
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
          bg="purple.500"
          opacity={0.08}
          borderRadius="full"
          filter="blur(140px)"
        />

        <Container maxW="900px" position="relative" zIndex={2}>
          <Card
            bg="rgba(12,18,35,0.88)"
            color="white"
            border="1px solid rgba(255,255,255,0.08)"
            rounded="30px"
            boxShadow="0 18px 50px rgba(0,0,0,0.25)"
          >
            <CardBody p={10} textAlign="center">
              <Heading size="md" mb={4}>
                {error || "Không tìm thấy thông tin đặt vé."}
              </Heading>
              <Button
                h="50px"
                px={8}
                rounded="full"
                bg="linear-gradient(90deg, #f59e0b, #f97316)"
                color="white"
                onClick={() => navigate("/")}
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 14px 28px rgba(249,115,22,0.28)",
                }}
              >
                Quay về trang chủ
              </Button>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  const { total_price } = booking;

  const parsedTotal =
    typeof total_price === "object" && total_price?.$numberDecimal
      ? parseFloat(total_price.$numberDecimal)
      : Number(total_price || 0);

  const combos = [];
  const rawCombos = booking.combos || [];
  if (Array.isArray(rawCombos) && rawCombos.length > 0) {
    rawCombos.forEach((c) => {
      const comboData = c.combo_id || c.combo || c;
      const name =
        comboData?.name || comboData?.title || c?.name || c?.title || "Combo";
      const quantity = c.quantity || c.qty || c.count || 1;
      combos.push({ name, quantity });
    });
  }

  return (
    <Box bg="#050814" minH="100vh" color="white" position="relative" overflow="hidden" py={10}>
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
        bg="purple.500"
        opacity={0.08}
        borderRadius="full"
        filter="blur(140px)"
      />

      <Container maxW="1200px" position="relative" zIndex={2}>
        <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={8} alignItems="start">
          {/* LEFT */}
          <Box gridColumn={{ base: "auto", xl: "span 2" }}>
            <Card
              bg="rgba(12,18,35,0.88)"
              border="1px solid rgba(255,255,255,0.08)"
              rounded="30px"
              boxShadow="0 18px 50px rgba(0,0,0,0.25)"
            >
              <CardBody p={{ base: 5, md: 8 }}>
                <VStack align="stretch" spacing={6}>
                  <VStack spacing={2} align="start">
                    <Badge
                      px={4}
                      py={1.5}
                      rounded="full"
                      bg="linear-gradient(90deg, #fb923c, #f97316)"
                      color="white"
                      fontWeight="700"
                      fontSize="0.8rem"
                      w="fit-content"
                    >
                      CINEMAGO CHECKOUT
                    </Badge>

                    <Heading size="lg" color="white">
                      Xác nhận và thanh toán
                    </Heading>

                    <Text color="gray.400" fontSize="sm">
                      Kiểm tra lại thông tin vé trước khi tiến hành thanh toán
                    </Text>
                  </VStack>

                  {booking?.showtime_id && (
                    <Card
                      bg="rgba(255,255,255,0.04)"
                      border="1px solid rgba(255,255,255,0.06)"
                      rounded="24px"
                    >
                      <CardBody p={5}>
                        <HStack align="start" spacing={5}>
                          {booking.showtime_id.movie_id?.poster_url && (
                            <Image
                              src={booking.showtime_id.movie_id.poster_url}
                              alt={booking.showtime_id.movie_id?.title || "Poster"}
                              boxSize={{ base: "110px", md: "140px" }}
                              objectFit="cover"
                              borderRadius="18px"
                              fallbackSrc="https://via.placeholder.com/140x200"
                            />
                          )}

                          <VStack align="start" spacing={2} flex="1">
                            <Heading as="h3" size="md" color="white">
                              {booking.showtime_id.movie_id?.title}
                            </Heading>

                            {!!booking.showtime_id.movie_id?.genre?.length && (
                              <HStack spacing={2} flexWrap="wrap">
                                {booking.showtime_id.movie_id.genre.map((g, idx) => (
                                  <Badge
                                    key={idx}
                                    px={3}
                                    py={1}
                                    rounded="full"
                                    bg="whiteAlpha.200"
                                    color="white"
                                    fontWeight="500"
                                  >
                                    {g}
                                  </Badge>
                                ))}
                              </HStack>
                            )}

                            {booking.showtime_id.movie_id?.duration && (
                              <Text fontSize="sm" color="gray.400">
                                Thời lượng: {booking.showtime_id.movie_id.duration} phút
                              </Text>
                            )}

                            {booking.showtime_id.movie_id?.description && (
                              <Text fontSize="sm" color="gray.400" noOfLines={3}>
                                {booking.showtime_id.movie_id.description}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  )}

                  <Card
                    bg="rgba(255,255,255,0.04)"
                    border="1px solid rgba(255,255,255,0.06)"
                    rounded="24px"
                  >
                    <CardBody p={5}>
                      <VStack align="stretch" spacing={3}>
                        <Heading as="h4" size="sm" color="orange.300">
                          Thông tin đặt vé
                        </Heading>

                        <Divider borderColor="whiteAlpha.200" />

                        <Text color="gray.200">
                          <strong>Mã đặt vé:</strong> {booking.order_code || booking._id || "N/A"}
                        </Text>

                        <Text color="gray.200">
                          <strong>Rạp:</strong> {booking.showtime_id.room_id?.theater_id?.name}
                        </Text>

                        <Text color="gray.200">
                          <strong>Phòng chiếu:</strong> {booking.showtime_id.room_id?.name}
                        </Text>

                        <Text color="gray.200">
                          <strong>Suất chiếu:</strong>{" "}
                          {booking.showtime_id.start_time?.vietnamFormatted ||
                            new Date(
                              booking.showtime_id.start_time?.vietnam ||
                                booking.showtime_id.start_time
                            ).toLocaleString("vi-VN")}
                        </Text>

                        {!!seats.length && (
                          <Text color="gray.200">
                            <strong>Ghế:</strong>{" "}
                            {seats
                              .map((s) => s.seat_id?.seat_number || s.seat_number)
                              .join(", ")}
                          </Text>
                        )}

                        {combos.length > 0 && (
                          <Box>
                            <Text color="gray.200" mb={1}>
                              <strong>Combo đã chọn:</strong>
                            </Text>
                            <VStack align="start" spacing={1} ml={3}>
                              {combos.map((combo, idx) => (
                                <Text key={idx} fontSize="sm" color="gray.300">
                                  • {combo.name} x{combo.quantity}
                                </Text>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* RIGHT */}
          <Box>
            <Card
              bg="rgba(12,18,35,0.88)"
              border="1px solid rgba(255,255,255,0.08)"
              rounded="30px"
              boxShadow="0 18px 50px rgba(0,0,0,0.25)"
              position={{ base: "static", xl: "sticky" }}
              top="24px"
            >
              <CardBody p={{ base: 5, md: 6 }}>
                <VStack align="stretch" spacing={5}>
                  <Heading size="md" color="white">
                    Tóm tắt thanh toán
                  </Heading>

                  <Divider borderColor="whiteAlpha.200" />

                  <Flex justify="space-between" align="center">
                    <Text color="gray.400">Tổng thanh toán</Text>
                    <Text fontSize="2xl" fontWeight="800" color="orange.300">
                      {parsedTotal.toLocaleString("vi-VN")}đ
                    </Text>
                  </Flex>

                  {error && <Text color="red.400">{error}</Text>}

                  <VStack spacing={4} mt={2}>
                    <Button
                      h="54px"
                      w="full"
                      rounded="full"
                      bg="linear-gradient(90deg, #f59e0b, #f97316)"
                      color="white"
                      onClick={handleCheckout}
                      isLoading={isProcessingPayment}
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "0 18px 36px rgba(249,115,22,0.30)",
                      }}
                      spinner={<Spinner size="md" />}
                    >
                      {isProcessingPayment ? "Đang xử lý..." : "Thanh toán ngay"}
                    </Button>

                    <Button
                      variant="outline"
                      borderColor="red.400"
                      color="red.300"
                      h="54px"
                      w="full"
                      rounded="full"
                      onClick={onOpen}
                      isLoading={isCancelling}
                      _hover={{
                        bg: "rgba(239,68,68,0.10)",
                        borderColor: "red.300",
                      }}
                    >
                      Hủy đặt vé
                    </Button>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </SimpleGrid>
      </Container>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay bg="blackAlpha.800" backdropFilter="blur(4px)">
          <AlertDialogContent
            bg="rgba(12,18,35,0.96)"
            color="white"
            border="1px solid rgba(255,255,255,0.08)"
            rounded="24px"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="orange.300">
              Xác nhận hủy
            </AlertDialogHeader>

            <AlertDialogBody color="gray.300">
              Bạn có chắc chắn muốn hủy đặt vé này không? Hành động này không thể hoàn tác.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} bg="gray.700" _hover={{ bg: "gray.600" }}>
                Không
              </Button>
              <Button
                colorScheme="red"
                onClick={handleCancelBooking}
                ml={3}
                isLoading={isCancelling}
                rounded="full"
              >
                Hủy đặt vé
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default CartCheckoutPage;