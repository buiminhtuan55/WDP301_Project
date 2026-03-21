import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Card,
  CardBody,
  Image,
  VStack,
  HStack,
  Button,
  Spinner,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { TimeIcon, CalendarIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/apiService";

const MovieRecommendations = ({ userId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [basedOn, setBasedOn] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Chỉ gọi API nếu user đã đăng nhập
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    apiService.get("/api/ai/recommendations", {}, (data, success) => {
      setLoading(false);
      if (success) {
        // API có thể trả về data.recommendations hoặc data.data
        const recommendations = data.recommendations || data.data || [];
        if (recommendations.length > 0) {
          setRecommendations(recommendations);
          setMessage(data.message || "Gợi ý phim dành cho bạn:");
          setBasedOn(data.basedOn || "history");
        } else {
          // Không có gợi ý, không hiển thị lỗi
          setRecommendations([]);
        }
      } else {
        // Chỉ hiển thị lỗi nếu thực sự có lỗi
        console.error('Error loading recommendations:', data);
        // Không set error để không hiển thị thông báo lỗi
        setRecommendations([]);
      }
    });
  }, []);

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "";
    return `${minutes} phút`;
  };

  // Nếu user chưa đăng nhập, không hiển thị component
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <Box bg="gray.900" py={10}>
        <Container maxW="1400px">
          <Box textAlign="center">
            <Spinner color="orange.400" size="xl" />
            <Text color="gray.300" mt={4}>
              Đang tải gợi ý phim...
            </Text>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="gray.900" py={10}>
        <Container maxW="1400px">
          <Text color="red.400" textAlign="center">{error}</Text>
        </Container>
      </Box>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Box bg="gray.900" py={10}>
      <Container maxW="1400px">
        <VStack align="stretch" spacing={6}>
          <Box>
            <Heading size="xl" color="orange.400" mb={2}>
              Gợi ý phim dành cho bạn
            </Heading>
            <Text color="gray.300" fontSize="md">
              {message}
            </Text>
            {basedOn === "history" && (
              <Badge colorScheme="orange" mt={2}>
                Dựa trên lịch sử xem phim
              </Badge>
            )}
          </Box>

          <Divider borderColor="gray.700" />

          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)",
            }}
            gap={6}
          >
            {recommendations.map((movie) => (
              <Card
                key={movie._id}
                bg="gray.800"
                color="white"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.700"
                _hover={{ borderColor: "orange.400", transform: "translateY(-4px)" }}
                transition="all 0.3s"
                cursor="pointer"
                onClick={() => navigate(`/movies/${movie._id}`)}
              >
                <Box position="relative">
                  <Image
                    src={movie.poster_url}
                    alt={movie.title}
                    borderTopRadius="md"
                    height="400px"
                    width="100%"
                    objectFit="contain"
                    fallbackSrc="https://via.placeholder.com/300x450?text=No+Image"
                  />
                </Box>

                <CardBody>
                  <VStack align="start" spacing={3}>
                    <Heading size="md" color="orange.400" noOfLines={2}>
                      {movie.title}
                    </Heading>
                    {movie.genre && movie.genre.length > 0 && (
                      <Text fontSize="sm" color="gray.300" noOfLines={1}>
                        {movie.genre.join(", ")}
                      </Text>
                    )}
                    <HStack spacing={2} color="gray.300">
                      <TimeIcon />
                      <Text fontSize="sm">{formatDuration(movie.duration)}</Text>
                    </HStack>

                    <Button
                      bg="orange.400"
                      color="white"
                      _hover={{ bg: "orange.500" }}
                      width="100%"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/movies/${movie._id}`);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default MovieRecommendations;
