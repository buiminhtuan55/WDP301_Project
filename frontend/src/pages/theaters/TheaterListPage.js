import {
  Box,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Button,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Flex,
  Badge,
  Container,
  VStack,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiService from "../../services/apiService";

const TheaterListPage = () => {
  const navigate = useNavigate();
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTheaters = async () => {
      setLoading(true);
      setError("");

      try {
        apiService.post(
          "/api/public/theaters/list",
          {
            page: 1,
            pageSize: 1000,
            status: "active",
            orderBy: "name",
            orderDir: "ASC",
          },
          (data, success) => {
            if (success) {
              setTheaters(data.list || []);
            } else {
              setError(data?.message || "Không thể tải danh sách rạp chiếu");
            }
            setLoading(false);
          }
        );
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi tải danh sách rạp");
        setLoading(false);
      }
    };

    fetchTheaters();
  }, []);

  if (loading) {
    return (
      <Box minH="100vh" bg="#050814">
        <Center minH="100vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="orange.400" thickness="4px" />
            <Text color="gray.400">Đang tải danh sách rạp...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg="#050814">
        <Center minH="100vh" px={4}>
          <Alert
            status="error"
            maxW="lg"
            rounded="2xl"
            bg="rgba(255,255,255,0.06)"
            color="white"
            border="1px solid rgba(255,255,255,0.08)"
          >
            <AlertIcon />
            {error}
          </Alert>
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#050814" position="relative" overflow="hidden">
      {/* Glow background */}
      <Box
        position="absolute"
        top="-120px"
        left="-120px"
        w="320px"
        h="320px"
        bg="orange.400"
        opacity={0.08}
        borderRadius="full"
        filter="blur(120px)"
      />
      <Box
        position="absolute"
        bottom="-140px"
        right="-120px"
        w="360px"
        h="360px"
        bg="purple.500"
        opacity={0.08}
        borderRadius="full"
        filter="blur(140px)"
      />

      {/* Hero */}
      <Box
        position="relative"
        py={{ base: 14, md: 20 }}
        borderBottom="1px solid rgba(255,255,255,0.06)"
        bg="linear-gradient(180deg, rgba(8,12,28,0.96), rgba(5,8,20,0.88))"
      >
        <Container maxW="1400px" position="relative" zIndex={2}>
          <VStack align="start" spacing={4}>
            <Badge
              px={4}
              py={1.5}
              borderRadius="full"
              bg="linear-gradient(90deg, #fb923c, #f97316)"
              color="white"
              fontSize="0.82rem"
              fontWeight="700"
            >
              CINEMAGO THEATERS
            </Badge>

            <Heading
              color="white"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.05"
              maxW="900px"
            >
              Khám phá hệ thống
              <Text as="span" color="orange.400">
                {" "}
                rạp chiếu phim{" "}
              </Text>
              của CineMago
            </Heading>

            <Text color="gray.300" maxW="760px" fontSize={{ base: "md", md: "lg" }}>
              Chọn rạp gần bạn để xem phim, tra cứu suất chiếu và trải nghiệm
              không gian điện ảnh hiện đại.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="1400px" position="relative" zIndex={2} py={10}>
        <Flex
          justify="space-between"
          align={{ base: "start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
          mb={8}
        >
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="white">
              Danh sách rạp chiếu
            </Heading>
            <Text color="gray.400">
              Hiện có {theaters.length} rạp đang hoạt động
            </Text>
          </VStack>
        </Flex>

        {theaters.length === 0 ? (
          <Center py={20}>
            <VStack spacing={3}>
              <Text color="gray.300" fontSize="lg">
                Không có rạp chiếu nào
              </Text>
              <Text color="gray.500" fontSize="sm">
                Hiện chưa có dữ liệu rạp đang hoạt động
              </Text>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={7}>
            {theaters.map((theater) => {
              const theaterId = theater.id || theater._id;

              return (
                <Card
                  key={theaterId}
                  bg="rgba(12,18,35,0.88)"
                  color="white"
                  rounded="28px"
                  overflow="hidden"
                  border="1px solid rgba(255,255,255,0.08)"
                  boxShadow="0 18px 50px rgba(0,0,0,0.25)"
                  transition="all 0.3s ease"
                  cursor="pointer"
                  _hover={{
                    transform: "translateY(-8px)",
                    borderColor: "rgba(251,146,60,0.40)",
                    boxShadow: "0 26px 60px rgba(0,0,0,0.38)",
                  }}
                  onClick={() => navigate(`/theaters/${theaterId}`)}
                >
                  {/* Top banner */}
                  <Box
                    h="140px"
                    bg="linear-gradient(135deg, rgba(249,115,22,0.25), rgba(15,23,42,0.85))"
                    position="relative"
                  >
                    <Box
                      position="absolute"
                      inset="0"
                      bg="radial-gradient(circle at top right, rgba(251,146,60,0.25), transparent 45%)"
                    />
                    <Flex
                      position="absolute"
                      left={6}
                      right={6}
                      bottom={5}
                      justify="space-between"
                      align="end"
                    >
                      <VStack align="start" spacing={1}>
                        <Badge
                          colorScheme="green"
                          px={3}
                          py={1}
                          rounded="full"
                          fontSize="0.72rem"
                        >
                          HOẠT ĐỘNG
                        </Badge>
                        <Heading size="md" color="white" noOfLines={2}>
                          {theater.name}
                        </Heading>
                      </VStack>
                    </Flex>
                  </Box>

                  <CardBody p={6}>
                    <VStack align="stretch" spacing={4}>
                      <Box>
                        <Text color="gray.400" fontSize="sm" mb={1}>
                          Địa điểm
                        </Text>
                        <Text color="gray.200" fontSize="sm">
                          📍 {theater.location || "Chưa cập nhật địa chỉ"}
                        </Text>
                      </Box>

                      <Divider borderColor="whiteAlpha.200" />

                      <HStack spacing={4} align="stretch">
                        <Box
                          flex="1"
                          p={4}
                          rounded="20px"
                          bg="whiteAlpha.60"
                          border="1px solid rgba(255,255,255,0.06)"
                        >
                          <Text color="gray.400" fontSize="xs" mb={1}>
                            Số phòng
                          </Text>
                          <Text color="orange.300" fontWeight="700" fontSize="lg">
                            {theater.rooms_count || 0}
                          </Text>
                        </Box>

                        <Box
                          flex="1"
                          p={4}
                          rounded="20px"
                          bg="whiteAlpha.60"
                          border="1px solid rgba(255,255,255,0.06)"
                        >
                          <Text color="gray.400" fontSize="xs" mb={1}>
                            Tổng ghế
                          </Text>
                          <Text color="orange.300" fontWeight="700" fontSize="lg">
                            {theater.total_seats || 0}
                          </Text>
                        </Box>
                      </HStack>

                      <Button
                        w="full"
                        h="50px"
                        rounded="full"
                        bg="linear-gradient(90deg, #f59e0b, #f97316)"
                        color="white"
                        fontWeight="700"
                        _hover={{
                          transform: "translateY(-1px)",
                          boxShadow: "0 14px 28px rgba(249,115,22,0.28)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/theaters/${theaterId}`);
                        }}
                      >
                        Xem phim và suất chiếu
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
};

export default TheaterListPage;