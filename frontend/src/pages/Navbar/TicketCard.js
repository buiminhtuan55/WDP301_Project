import { Box, Text, Badge, HStack, VStack, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function TicketCard({ ticket, bookingId }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Countdown cho booking pending có expires_at
  useEffect(() => {
    if (!ticket.expires_at || ticket.status !== 'pending') return;

    const calcTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(ticket.expires_at).getTime();
      return Math.max(0, Math.floor((expires - now) / 1000));
    };

    setTimeLeft(calcTimeLeft());

    const timer = setInterval(() => {
      const remaining = calcTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [ticket.expires_at, ticket.status]);

  const handlePayment = (e) => {
    e.stopPropagation();
    navigate(`/bookings/checkout/${bookingId}`);
  };

  const isExpired = timeLeft !== null && timeLeft <= 0;
  const showPayButton = ticket.status === 'pending' && !isExpired;

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      p={4}
      bg="#1a1d29"
      color="white"
      shadow="md"
      _hover={{ shadow: "lg", transform: "scale(1.02)", transition: "0.2s", cursor: "pointer", borderColor: "#ff9900" }}
      onClick={() => navigate(`/ticket-detail/${bookingId}`)}
    >
      <VStack align="start" spacing={2}>
        <Text fontWeight="bold" fontSize="lg" color="orange.400">
          🎬 {ticket.movie}
        </Text>
        {ticket.bookingId && (
          <Text fontSize="xs" color="gray.500">
            Mã vé: {ticket.bookingId}
          </Text>
        )}
        {ticket.theater && (
          <Text fontSize="sm" color="blue.300">
            🏢 Rạp: {ticket.theater}
          </Text>
        )}
        <Text fontSize="sm" color="gray.300">
          Phòng: {ticket.room} 
        </Text>
        {ticket.combos && ticket.combos.length > 0 && (
          <Box fontSize="sm" color="purple.300">
            <Text fontWeight="semibold" mb={1}>🍿 Combo:</Text>
            {ticket.combos.map((combo, idx) => (
              <Text key={idx} fontSize="xs" ml={2}>
                • {combo.name} x{combo.quantity}
              </Text>
            ))}
          </Box>
        )}
        <HStack>
          <Badge
            px={2}
            py={1}
            borderRadius="md"
          >
          </Badge>
          <Text fontWeight="medium" fontSize="sm" color="gray.400">
            {ticket.date}
          </Text>
        </HStack>
        <Text color="orange.300" fontWeight="bold" fontSize="lg">
          {ticket.total?.toLocaleString("vi-VN")} ₫
        </Text>

        {/* Countdown timer */}
        {ticket.status === 'pending' && timeLeft !== null && (
          <Box
            w="full"
            py={2}
            px={3}
            rounded="lg"
            bg={isExpired ? "rgba(239,68,68,0.15)" : timeLeft <= 60 ? "rgba(239,68,68,0.12)" : "rgba(251,146,60,0.10)"}
            textAlign="center"
          >
            {isExpired ? (
              <Text fontSize="sm" color="red.400" fontWeight="600">
                ⏰ Đã hết thời gian thanh toán
              </Text>
            ) : (
              <HStack justify="center" spacing={2}>
                <Text fontSize="xs" color={timeLeft <= 60 ? "red.300" : "orange.300"}>
                  ⏱️ Còn lại:
                </Text>
                <Text
                  fontSize="md"
                  fontWeight="800"
                  color={timeLeft <= 60 ? "red.400" : "orange.400"}
                  fontFamily="mono"
                >
                  {formatTime(timeLeft)}
                </Text>
              </HStack>
            )}
          </Box>
        )}

        {showPayButton && (
          <Button
            colorScheme="orange"
            size="sm"
            width="full"
            onClick={handlePayment}
            isLoading={isLoading}
          >
            Tiếp tục thanh toán
          </Button>
        )}
      </VStack>
    </Box>
  );
}
