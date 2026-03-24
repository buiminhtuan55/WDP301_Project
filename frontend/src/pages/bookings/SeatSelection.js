import {
  Box,
  Badge,
  HStack,
  Spinner,
  Text,
  VStack,
  Button,
  useToast,
  Flex,
  Divider,
  SimpleGrid,
  Heading,
  IconButton,
  Image,
  Container,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { CloseIcon, AddIcon, MinusIcon } from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiService from "../../services/apiService";

const seatTypes = {
  booked: { color: "#111111", label: "Đã đặt" },
  selected: { color: "#ec4899", label: "Ghế bạn chọn" },
  normal: { color: "#7c3aed", label: "Ghế thường" },
  vip: { color: "#ef4444", label: "Ghế VIP" },
};

export default function SeatSelection() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    Promise.all([
      new Promise((resolve) => {
        apiService.getById("/api/showtimes/", showtimeId, (data, success) => {
          if (!isMounted) return resolve(null);
          if (success) {
            setShowtime(data?.data);
            resolve(data?.data?.room_id?._id || data?.data?.room_id);
          } else {
            setError(data?.message || "Không thể tải thông tin suất chiếu");
            resolve(null);
          }
        });
      }),
      new Promise((resolve) => {
        apiService.getPublic(`/api/showtimes/${showtimeId}/booked-seats`, {}, (data, success) => {
          if (!isMounted) return resolve([]);
          if (success) {
            const bookedIds = (data?.booked_seats || []).map((id) => String(id));
            setBookedSeatIds(bookedIds);
            resolve(bookedIds);
          } else {
            console.error("Failed to load booked seats:", data);
            resolve([]);
          }
        });
      }),
    ]).then(([roomId]) => {
      if (!isMounted) return;

      if (!roomId) {
        setLoading(false);
        return;
      }

      apiService.getPublic(`/api/public/rooms/${roomId}/seats`, {}, (seatRes, ok) => {
        if (!isMounted) return;
        if (ok) {
          const normalizeMoney = (value) => {
            if (value == null) return NaN;
            if (typeof value === "number") return value;
            if (typeof value === "string") {
              const sanitized = value.replace(/[^0-9.-]/g, "");
              const num = Number(sanitized);
              return Number.isFinite(num) ? num : NaN;
            }
            if (typeof value === "object") {
              if (Object.prototype.hasOwnProperty.call(value, "$numberDecimal")) {
                const num = Number(value.$numberDecimal);
                return Number.isFinite(num) ? num : NaN;
              }
              if (typeof value.toString === "function") {
                const num = Number(value.toString());
                return Number.isFinite(num) ? num : NaN;
              }
            }
            return NaN;
          };

          const seatsWithId = (seatRes?.list || []).map((s) => {
            const normalizedBase = normalizeMoney(s.base_price);
            const normalizedPrice = normalizeMoney(s.price);
            const effectivePrice =
              Number.isFinite(normalizedBase) && normalizedBase > 0
                ? normalizedBase
                : Number.isFinite(normalizedPrice) && normalizedPrice > 0
                ? normalizedPrice
                : NaN;

            return {
              ...s,
              id: s._id || s.id,
              base_price: Number.isFinite(normalizedBase) ? normalizedBase : undefined,
              price: Number.isFinite(effectivePrice) ? effectivePrice : undefined,
              _effectivePrice: Number.isFinite(effectivePrice) ? effectivePrice : undefined,
            };
          });
          setSeats(Array.isArray(seatsWithId) ? seatsWithId : []);
        } else {
          setError(seatRes?.message || "Không thể tải danh sách ghế");
        }
        setLoading(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [showtimeId]);

  useEffect(() => {
    setLoadingCombos(true);
    apiService.getPublic("/api/combos", {}, (data, success) => {
      if (success && data?.data) {
        const activeCombos = (data.data || [])
          .filter((combo) => combo.status === "active")
          .map((combo) => {
            let price = 0;
            if (combo.price) {
              if (typeof combo.price === "number") {
                price = combo.price;
              } else if (typeof combo.price === "object" && combo.price.$numberDecimal) {
                price = Number(combo.price.$numberDecimal);
              } else if (typeof combo.price === "string") {
                price = Number(combo.price) || 0;
              }
            }

            return {
              id: combo._id,
              name: combo.name,
              description: combo.description,
              price: price,
              image_url: combo.image_url,
            };
          });
        setCombos(activeCombos);
      } else {
        console.error("Failed to load combos:", data);
        setCombos([]);
      }
      setLoadingCombos(false);
    });
  }, []);

  const handleSelect = (seat) => {
    const seatIdString = String(seat.id || seat._id);
    if (bookedSeatIds.includes(seatIdString)) return;

    setSelectedSeats((prev) => {
      const index = prev.findIndex((s) => s.id === seat.id);
      if (index !== -1) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const removeSeat = (seatId) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  const seatsByRow = useMemo(() => {
    const map = {};
    seats.forEach((s) => {
      const seatNo = String(s.seat_number || "");
      const rowKey = seatNo.charAt(0).toUpperCase();
      if (!map[rowKey]) map[rowKey] = [];
      map[rowKey].push(s);
    });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const numA = parseInt(a.seat_number.slice(1), 10);
        const numB = parseInt(b.seat_number.slice(1), 10);
        return numA - numB;
      });
    });
    return map;
  }, [seats]);

  const deriveSeatPrice = (seat) => {
    const direct = typeof seat?._effectivePrice === "number" ? seat._effectivePrice : undefined;
    if (Number.isFinite(direct) && direct > 0) return direct;

    const base = typeof seat?.base_price === "number" ? seat.base_price : undefined;
    if (Number.isFinite(base) && base > 0) return base;

    const explicit = typeof seat?.price === "number" ? seat.price : undefined;
    if (Number.isFinite(explicit) && explicit > 0) return explicit;

    let fallback = Number(showtime?.price) || 0;
    if (!Number.isFinite(fallback) || fallback <= 0) fallback = 50000;
    if (seat?.type === "vip") fallback = Math.round(fallback * 1.5);
    if (seat?.type === "couple") fallback = Math.round(fallback * 3);
    return fallback;
  };

  const seatTotal = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => {
      const price = deriveSeatPrice(seat);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
  }, [selectedSeats, showtime]);

  const comboTotal = useMemo(() => {
    return selectedCombos.reduce((sum, combo) => {
      return sum + combo.price * combo.quantity;
    }, 0);
  }, [selectedCombos]);

  const total = seatTotal + comboTotal;

  const handleComboIncrease = (combo) => {
    const existing = selectedCombos.find((c) => c.id === combo.id);
    if (existing) {
      setSelectedCombos(
        selectedCombos.map((c) =>
          c.id === combo.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setSelectedCombos([...selectedCombos, { ...combo, quantity: 1 }]);
    }
  };

  const handleComboDecrease = (comboId) => {
    const existing = selectedCombos.find((c) => c.id === comboId);
    if (existing) {
      if (existing.quantity === 1) {
        setSelectedCombos(selectedCombos.filter((c) => c.id !== comboId));
      } else {
        setSelectedCombos(
          selectedCombos.map((c) =>
            c.id === comboId ? { ...c, quantity: c.quantity - 1 } : c
          )
        );
      }
    }
  };

  const getComboQuantity = (comboId) => {
    const combo = selectedCombos.find((c) => c.id === comboId);
    return combo ? combo.quantity : 0;
  };

  const handleNext = async () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Chưa chọn ghế",
        description: "Vui lòng chọn ít nhất 1 ghế để tiếp tục.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsCreatingBooking(true);

    const bookingData = {
      showtime_id: showtimeId,
      seat_ids: selectedSeats.map((s) => s.id),
      payment_method: "online",
      combos: selectedCombos.map((c) => ({
        combo_id: c.id,
        quantity: c.quantity,
      })),
    };

    apiService.post("/api/bookings", bookingData, (response, success) => {
      setIsCreatingBooking(false);
      if (success) {
        const bookingId = response.booking._id;
        navigate(`/bookings/checkout/${bookingId}`);
      } else {
        toast({
          title: "Lỗi",
          description: "Đã có người chọn ghế này. Vui lòng chọn ghế khác",
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
          <Text color="gray.400">Đang tải sơ đồ ghế...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="#050814" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="red.400" fontWeight="semibold">
          {error}
        </Text>
      </Box>
    );
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

      <Container maxW="1400px" position="relative" zIndex={2}>
        <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={8} alignItems="start">
          {/* LEFT - SCREEN + SEATS */}
          <Box gridColumn={{ base: "auto", xl: "span 2" }}>
            <Card
              bg="rgba(12,18,35,0.88)"
              border="1px solid rgba(255,255,255,0.08)"
              rounded="30px"
              boxShadow="0 18px 50px rgba(0,0,0,0.25)"
            >
              <CardBody p={{ base: 5, md: 8 }}>
                <VStack spacing={8} w="100%">
                  <VStack spacing={3} w="100%">
                    <Heading size="lg" color="white" textAlign="center">
                      Chọn ghế ngồi
                    </Heading>
                    <Text color="gray.400" textAlign="center" fontSize="sm">
                      Hãy chọn vị trí ghế bạn muốn đặt cho suất chiếu này
                    </Text>
                  </VStack>

                  <Box w="100%" maxW="760px" mx="auto">
                    <Box
                      w="100%"
                      h="18px"
                      roundedTop="full"
                      bg="linear-gradient(90deg, rgba(249,115,22,0.1), rgba(249,115,22,0.95), rgba(249,115,22,0.1))"
                      boxShadow="0 8px 40px rgba(249,115,22,0.45)"
                    />
                    <Text
                      textAlign="center"
                      mt={3}
                      fontSize="sm"
                      color="gray.300"
                      fontWeight="600"
                      letterSpacing="0.2em"
                    >
                      MÀN HÌNH
                    </Text>
                  </Box>

                  <VStack spacing={3} w="100%" overflowX="auto" pb={2}>
                    {Object.keys(seatsByRow)
                      .sort()
                      .map((rowKey) => (
                        <HStack
                          key={rowKey}
                          justify="center"
                          spacing={{ base: 2, md: 3 }}
                          minW="max-content"
                        >
                          <Box
                            w="34px"
                            h="34px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="gray.400"
                            fontWeight="bold"
                            fontSize="sm"
                          >
                            {rowKey}
                          </Box>

                          {seatsByRow[rowKey].map((seat) => {
                            const isSelected = selectedSeats.some((s) => s.id === seat.id);
                            const seatIdString = String(seat.id || seat._id);
                            const isBooked = bookedSeatIds.includes(seatIdString);

                            let color, hoverColor;
                            if (isBooked) {
                              color = seatTypes.booked.color;
                              hoverColor = seatTypes.booked.color;
                            } else if (isSelected) {
                              color = seatTypes.selected.color;
                              hoverColor = seatTypes.selected.color;
                            } else if (seat.type === "vip") {
                              color = seatTypes.vip.color;
                              hoverColor = "#f87171";
                            } else {
                              color = seatTypes.normal.color;
                              hoverColor = "#8b5cf6";
                            }

                            return (
                              <Button
                                key={seat.id}
                                size="sm"
                                w={{ base: "34px", md: "38px" }}
                                h={{ base: "34px", md: "38px" }}
                                minW={{ base: "34px", md: "38px" }}
                                p={0}
                                fontSize="xs"
                                fontWeight="bold"
                                bg={color}
                                color="white"
                                border="1px solid rgba(255,255,255,0.10)"
                                borderRadius="10px"
                                _hover={{
                                  bg: isBooked ? color : hoverColor,
                                  opacity: isBooked ? 0.7 : 1,
                                  transform: isBooked ? "none" : "translateY(-1px)",
                                }}
                                onClick={() => handleSelect(seat)}
                                isDisabled={isBooked}
                                cursor={isBooked ? "not-allowed" : "pointer"}
                              >
                                {seat.seat_number.slice(1)}
                              </Button>
                            );
                          })}
                        </HStack>
                      ))}
                  </VStack>

                  <SimpleGrid
                    columns={{ base: 2, md: 4 }}
                    spacing={4}
                    mt={2}
                    mx="auto"
                    maxW="720px"
                    w="100%"
                  >
                    {Object.values(seatTypes).map((type) => (
                      <Flex
                        key={type.label}
                        align="center"
                        gap={3}
                        p={3}
                        rounded="18px"
                        bg="rgba(255,255,255,0.04)"
                        border="1px solid rgba(255,255,255,0.06)"
                      >
                        <Box w="18px" h="18px" bg={type.color} borderRadius="6px" />
                        <Text fontSize="sm" color="gray.300">
                          {type.label}
                        </Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* RIGHT - BOOKING SUMMARY */}
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
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      {showtime?.movie_id?.title}
                    </Heading>
                    <Text color="gray.400" fontSize="sm">
                      {showtime?.room_id?.name} -{" "}
                      {new Date(
                        showtime?.start_time?.vietnam ||
                          showtime?.start_time?.utc ||
                          showtime?.start_time
                      ).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(
                        showtime?.start_time?.vietnam ||
                          showtime?.start_time?.utc ||
                          showtime?.start_time
                      ).toLocaleDateString("vi-VN")}
                    </Text>
                  </Box>

                  <Divider borderColor="whiteAlpha.200" />

                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={3}>
                      Chỗ ngồi đã chọn
                    </Text>

                    <Flex gap={2} flexWrap="wrap">
                      {selectedSeats.length === 0 ? (
                        <Text fontSize="sm" color="gray.500">
                          Chưa chọn ghế
                        </Text>
                      ) : (
                        selectedSeats.map((s) => (
                          <Badge
                            key={s.id}
                            px={3}
                            py={2}
                            rounded="full"
                            bg="rgba(236,72,153,0.18)"
                            color="pink.200"
                            border="1px solid rgba(236,72,153,0.28)"
                            display="flex"
                            alignItems="center"
                            gap={2}
                          >
                            {s.seat_number}
                            <CloseIcon
                              boxSize={2}
                              cursor="pointer"
                              onClick={() => removeSeat(s.id)}
                              _hover={{ color: "white" }}
                            />
                          </Badge>
                        ))
                      )}
                    </Flex>
                  </Box>

                  {selectedSeats.length > 0 && (
                    <>
                      <Divider borderColor="whiteAlpha.200" />

                      <Box>
                        <Flex align="center" gap={2} mb={3}>
                          <Text fontSize="lg" fontWeight="700" color="orange.400">
                            🍿 Chọn combo
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            (Tùy chọn)
                          </Text>
                        </Flex>

                        {loadingCombos ? (
                          <Flex justify="center" align="center" py={4}>
                            <Spinner color="orange.400" size="sm" />
                          </Flex>
                        ) : combos.length === 0 ? (
                          <Text fontSize="sm" color="gray.500" py={4} textAlign="center">
                            Không có combo nào khả dụng
                          </Text>
                        ) : (
                          <Box
                            maxH="260px"
                            overflowY="auto"
                            css={{
                              "&::-webkit-scrollbar": { width: "5px" },
                              "&::-webkit-scrollbar-track": { background: "transparent" },
                              "&::-webkit-scrollbar-thumb": {
                                background: "#4a4b53",
                                borderRadius: "8px",
                              },
                            }}
                          >
                            {combos.map((combo) => {
                              const quantity = getComboQuantity(combo.id);
                              return (
                                <Box
                                  key={combo.id}
                                  p={3}
                                  mb={3}
                                  bg="rgba(255,255,255,0.04)"
                                  border="1px solid rgba(255,255,255,0.06)"
                                  borderRadius="18px"
                                  _hover={{ bg: "rgba(255,255,255,0.06)" }}
                                  transition="0.2s"
                                >
                                  <Flex justify="space-between" align="center" gap={3}>
                                    <Flex flex="1" align="center" gap={3}>
                                      {combo.image_url && (
                                        <Image
                                          src={combo.image_url}
                                          alt={combo.name}
                                          boxSize="48px"
                                          objectFit="cover"
                                          borderRadius="12px"
                                          fallbackSrc="https://via.placeholder.com/48"
                                        />
                                      )}
                                      <Box flex="1">
                                        <Text fontWeight="600" fontSize="sm" color="white">
                                          {combo.name}
                                        </Text>
                                        <Text fontSize="xs" color="orange.300">
                                          {combo.price.toLocaleString("vi-VN")} đ
                                        </Text>
                                      </Box>
                                    </Flex>

                                    <HStack spacing={2}>
                                      <IconButton
                                        icon={<MinusIcon />}
                                        size="xs"
                                        colorScheme="red"
                                        variant="outline"
                                        onClick={() => handleComboDecrease(combo.id)}
                                        isDisabled={quantity === 0}
                                        borderRadius="full"
                                      />
                                      <Text
                                        fontWeight="700"
                                        minW="20px"
                                        textAlign="center"
                                        fontSize="sm"
                                      >
                                        {quantity}
                                      </Text>
                                      <IconButton
                                        icon={<AddIcon />}
                                        size="xs"
                                        colorScheme="green"
                                        variant="outline"
                                        onClick={() => handleComboIncrease(combo)}
                                        borderRadius="full"
                                      />
                                    </HStack>
                                  </Flex>
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    </>
                  )}

                  <Divider borderColor="whiteAlpha.200" />

                  <VStack spacing={2} align="stretch">
                    <Flex justify="space-between">
                      <Text fontSize="sm" color="gray.400">
                        Tiền vé
                      </Text>
                      <Text fontWeight="700">{seatTotal.toLocaleString("vi-VN")}đ</Text>
                    </Flex>

                    {selectedCombos.length > 0 && (
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.400">
                          Combo
                        </Text>
                        <Text fontWeight="700">{comboTotal.toLocaleString("vi-VN")}đ</Text>
                      </Flex>
                    )}

                    <Divider borderColor="whiteAlpha.200" my={1} />

                    <Flex justify="space-between" align="center">
                      <Text fontSize="md" color="orange.300" fontWeight="700">
                        Tổng cộng
                      </Text>
                      <Text fontWeight="800" color="orange.300" fontSize="2xl">
                        {total.toLocaleString("vi-VN")}đ
                      </Text>
                    </Flex>
                  </VStack>

                  <Button
                    h="54px"
                    rounded="full"
                    bg="linear-gradient(90deg, #f59e0b, #f97316)"
                    color="white"
                    fontWeight="700"
                    onClick={handleNext}
                    isLoading={isCreatingBooking}
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 18px 36px rgba(249,115,22,0.30)",
                    }}
                  >
                    Tiếp tục
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}