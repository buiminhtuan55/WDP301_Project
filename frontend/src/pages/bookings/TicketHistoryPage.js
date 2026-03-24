import {
  Box,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Center,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import apiService from "../../services/apiService";
import TicketCard from "../Navbar/TicketCard";

const TicketHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService.get("/api/bookings/my-bookings", {}, (data, success) => {
      if (success) {
        const list = Array.isArray(data) ? data : data?.list || [];
        setBookings(list);
      } else {
        setError(data?.message || "Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.");
      }
      setLoading(false);
    });
  }, []);

  const filterBookingsByStatus = (status) => {
    return bookings.filter((booking) => booking.status === status);
  };

  const renderTicketCard = (booking) => {
    const combos = [];
    const rawCombos = booking.combos || [];

    if (Array.isArray(rawCombos) && rawCombos.length > 0) {
      rawCombos.forEach((c) => {
        const comboData = c.combo_id || c.combo || c;
        const name = comboData?.name || comboData?.title || c?.name || c?.title || "Combo";
        const quantity = c.quantity || c.qty || c.count || 1;
        combos.push({ name, quantity });
      });
    }

    const bookingId = booking.order_code || booking._id || "";
    const theater = booking.showtime_id?.room_id?.theater_id?.name || "";

    return (
      <TicketCard
        key={booking._id}
        bookingId={booking._id}
        ticket={{
          movie: booking.showtime_id?.movie_id?.title || "",
          room: booking.showtime_id?.room_id?.name || "",
          theater: theater,
          bookingId: bookingId,
          combos: combos,
          seat: Array.isArray(booking.seats)
            ? booking.seats.map((s) => s.seat_id?.seat_number || s.seat_number).join(", ")
            : "",
          status: booking.status,
          payment_status: booking.payment_status,
          expires_at: booking.expires_at,
          date: booking.showtime_id?.start_time?.vietnamFormatted || "",
          total: booking.total_price?.$numberDecimal
            ? parseFloat(booking.total_price.$numberDecimal)
            : undefined,
        }}
      />
    );
  };

  const allBookings = bookings;
  const pendingBookings = filterBookingsByStatus("pending");
  const confirmedBookings = filterBookingsByStatus("confirmed");
  const cancelledBookings = filterBookingsByStatus("cancelled");

  if (loading) {
    return (
      <Center
        minH="100vh"
        bg="radial-gradient(circle at top center, rgba(38,56,110,0.28) 0%, rgba(7,13,29,1) 35%, rgba(3,8,20,1) 100%)"
        flexDirection="column"
      >
        <Spinner color="#ff8c2f" size="xl" thickness="4px" />
        <Text mt={4} color="white">
          Đang tải lịch sử đặt vé...
        </Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Box
        minH="100vh"
        bg="radial-gradient(circle at top center, rgba(38,56,110,0.28) 0%, rgba(7,13,29,1) 35%, rgba(3,8,20,1) 100%)"
        px={{ base: 4, md: 8 }}
        py={10}
      >
        <Alert
          status="error"
          borderRadius="18px"
          bg="rgba(239,68,68,0.12)"
          color="white"
          border="1px solid rgba(239,68,68,0.3)"
        >
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bg="radial-gradient(circle at top center, rgba(38,56,110,0.28) 0%, rgba(7,13,29,1) 35%, rgba(3,8,20,1) 100%)"
      px={{ base: 4, md: 8, lg: 12 }}
      py={{ base: 10, md: 14, lg: 16 }}
    >
      <Box maxW="1280px" mx="auto">
        {/* Header đồng bộ homepage */}
        <Box mb={{ base: 8, md: 10 }}>
          <Box
            display="inline-flex"
            alignItems="center"
            px={5}
            py={2}
            mb={5}
            borderRadius="full"
            bg="linear-gradient(90deg, #ff8c2f 0%, #ff6a00 100%)"
            boxShadow="0 8px 20px rgba(255, 140, 47, 0.25)"
          >
            <Text
              color="white"
              fontSize="sm"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="0.04em"
              lineHeight="1"
            >
              CINEMAGO PREMIUM EXPERIENCE
            </Text>
          </Box>

          <Text
            color="white"
            fontSize={{ base: "3xl", md: "5xl", lg: "6xl" }}
            fontWeight="800"
            lineHeight={{ base: "1.2", md: "1.1" }}
            maxW="780px"
            letterSpacing="-0.02em"
          >
            Lịch sử đặt vé{" "}
            <Text as="span" color="#ff8c2f">
              của bạn
            </Text>
          </Text>
        </Box>

        {/* Summary boxes */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
          <Box
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="22px"
            p={5}
            backdropFilter="blur(10px)"
          >
            <Text color="rgba(255,255,255,0.65)" fontSize="sm">
              Tất cả
            </Text>
            <Text color="white" fontSize="2xl" fontWeight="800" mt={1}>
              {allBookings.length}
            </Text>
          </Box>

          <Box
            bg="rgba(255, 153, 0, 0.08)"
            border="1px solid rgba(255, 153, 0, 0.18)"
            borderRadius="22px"
            p={5}
            backdropFilter="blur(10px)"
          >
            <Text color="rgba(255,255,255,0.65)" fontSize="sm">
              Đang chờ
            </Text>
            <Text color="#ffb347" fontSize="2xl" fontWeight="800" mt={1}>
              {pendingBookings.length}
            </Text>
          </Box>

          <Box
            bg="rgba(74, 222, 128, 0.08)"
            border="1px solid rgba(74, 222, 128, 0.18)"
            borderRadius="22px"
            p={5}
            backdropFilter="blur(10px)"
          >
            <Text color="rgba(255,255,255,0.65)" fontSize="sm">
              Đã thanh toán
            </Text>
            <Text color="#4ade80" fontSize="2xl" fontWeight="800" mt={1}>
              {confirmedBookings.length}
            </Text>
          </Box>

          <Box
            bg="rgba(248, 113, 113, 0.08)"
            border="1px solid rgba(248, 113, 113, 0.18)"
            borderRadius="22px"
            p={5}
            backdropFilter="blur(10px)"
          >
            <Text color="rgba(255,255,255,0.65)" fontSize="sm">
              Đã hủy
            </Text>
            <Text color="#f87171" fontSize="2xl" fontWeight="800" mt={1}>
              {cancelledBookings.length}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs variant="unstyled">
          <TabList
            mb={8}
            p={2}
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="20px"
            gap={2}
            flexWrap="wrap"
            backdropFilter="blur(10px)"
          >
            <Tab
              color="rgba(255,255,255,0.85)"
              fontWeight="700"
              borderRadius="14px"
              _selected={{ bg: "#ff8c2f", color: "white" }}
            >
              Tất cả ({allBookings.length})
            </Tab>
            <Tab
              color="rgba(255,255,255,0.85)"
              fontWeight="700"
              borderRadius="14px"
              _selected={{ bg: "#ff8c2f", color: "white" }}
            >
              Đang chờ ({pendingBookings.length})
            </Tab>
            <Tab
              color="rgba(255,255,255,0.85)"
              fontWeight="700"
              borderRadius="14px"
              _selected={{ bg: "#ff8c2f", color: "white" }}
            >
              Đã thanh toán ({confirmedBookings.length})
            </Tab>
            <Tab
              color="rgba(255,255,255,0.85)"
              fontWeight="700"
              borderRadius="14px"
              _selected={{ bg: "#ff8c2f", color: "white" }}
            >
              Đã hủy ({cancelledBookings.length})
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
                {allBookings.map(renderTicketCard)}
              </SimpleGrid>
            </TabPanel>

            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
                {pendingBookings.map(renderTicketCard)}
              </SimpleGrid>
            </TabPanel>

            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
                {confirmedBookings.map(renderTicketCard)}
              </SimpleGrid>
            </TabPanel>

            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
                {cancelledBookings.map(renderTicketCard)}
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default TicketHistoryPage;