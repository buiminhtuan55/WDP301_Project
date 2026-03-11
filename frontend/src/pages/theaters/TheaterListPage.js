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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiService from "../../services/apiService";

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Trang danh sách rạp chiếu.
 *
 * Hiển thị danh sách rạp chiếu hiện có trong hệ thống.
 *
 * Nếu không có rạp chiếu nào, sẽ hiển thị thông báo "Không có rạp chiếu nào".
 *
/*******  324ca549-650a-4128-a1b3-fd05c8e01061  *******/const TheaterListPage = () => {
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
          { page: 1, pageSize: 1000, status: "active", orderBy: "name", orderDir: "ASC" },
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
      <Center minH="80vh">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center minH="80vh">
        <Alert status="error" maxW="md">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

  return (
    <Box bg="#0f1117" color="white" minH="100vh" py={8}>
      <Box maxW="1200px" mx="auto" px={4}>
        <Heading color="orange.400" mb={8} textAlign="center">
          Danh sách Rạp chiếu
        </Heading>

        {theaters.length === 0 ? (
          <Center py={20}>
            <Text color="gray.400" fontSize="lg">
              Không có rạp chiếu nào
            </Text>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {theaters.map((theater) => {
              const theaterId = theater.id || theater._id;
              return (
                <Card
                  key={theaterId}
                  bg="#1a1e29"
                  borderRadius="lg"
                  overflow="hidden"
                  _hover={{ transform: "translateY(-4px)", boxShadow: "lg" }}
                  transition="all 0.3s"
                  cursor="pointer"
                  onClick={() => navigate(`/theaters/${theaterId}`)}
                >
                  <CardBody p={6}>
                    <Flex justify="space-between" align="start" mb={4}>
                      <Heading size="md" color="orange.300">
                        {theater.name}
                      </Heading>
                      <Badge colorScheme="green" fontSize="xs">
                        HOẠT ĐỘNG
                      </Badge>
                    </Flex>
                    <Text color="gray.300" fontSize="sm" mb={4}>
                      📍 {theater.location || "Chưa cập nhật địa chỉ"}
                    </Text>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Text color="gray.400" fontSize="xs">
                        Số phòng: <strong>{theater.rooms_count || 0}</strong>
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        Tổng ghế: <strong>{theater.total_seats || 0}</strong>
                      </Text>
                    </Flex>
                    <Button
                      colorScheme="orange"
                      size="sm"
                      w="full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/theaters/${theaterId}`);
                      }}
                    >
                      Xem phim và suất chiếu
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
};

export default TheaterListPage;

