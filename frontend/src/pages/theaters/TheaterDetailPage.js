import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Card,
  CardBody,
  Image,
  Badge,
  Button,
  Flex,
  Divider,
  Grid,
  Container,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import apiService from "../../services/apiService";
import { CalendarIcon, TimeIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

const TheaterDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [theater, setTheater] = useState(null);
  const [allShowtimes, setAllShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    const theaterPromise = new Promise((resolve) => {
      apiService.post(
        "/api/public/theaters/list",
        { page: 1, pageSize: 1000, status: "active" },
        (data, success) => {
          if (!isMounted) return;
          if (success) {
            const foundTheater = data.list.find((t) => (t.id || t._id) === id);
            if (foundTheater) {
              setTheater(foundTheater);
            } else {
              setError("Không tìm thấy rạp chiếu");
            }
          } else {
            setError(data?.message || "Không thể tải thông tin rạp");
          }
          resolve();
        }
      );
    });

    const showtimesPromise = new Promise((resolve) => {
      apiService.getPublic("/api/showtimes", {}, (data, success) => {
        if (!isMounted) return;
        if (success) {
          setAllShowtimes(Array.isArray(data?.data) ? data.data : []);
        }
        resolve();
      });
    });

    Promise.all([theaterPromise, showtimesPromise]).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const isToday = (dateString) => {
    if (!dateString) return false;

    const today = new Date();
    const vietnamToday = new Date(
      today.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );

    const dateMatch = dateString.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!dateMatch) return false;

    const [day, month, year] = dateMatch[1].split("/");
    const showtimeDate = new Date(year, month - 1, day);

    return showtimeDate.toDateString() === vietnamToday.toDateString();
  };

  const theaterShowtimes = useMemo(() => {
    if (!allShowtimes.length || !id) return [];

    return allShowtimes.filter((st) => {
      if (!st || st.status !== "active") return false;

      const theaterId =
        st.room_id?.theater_id?._id ||
        st.room_id?.theater_id ||
        st.room_id?.theater_id?.id;

      const theaterIdStr =
        typeof theaterId === "string"
          ? theaterId
          : theaterId?._id || theaterId?.id;

      return theaterIdStr === id || theaterId === id;
    });
  }, [allShowtimes, id]);

  const getMovieShowtimes = (movieId) => {
    const movieShowtimes = theaterShowtimes.filter((st) => {
      if (!st || st.status !== "active") return false;

      const movieIdMatches = (() => {
        const movieField = st.movie_id;
        if (!movieField) return false;
        if (typeof movieField === "string") return movieField === movieId;
        if (typeof movieField === "object" && movieField._id) {
          return movieField._id === movieId;
        }
        return false;
      })();

      const vietnamFormatted = st?.start_time?.vietnamFormatted;
      return (
        movieIdMatches &&
        typeof vietnamFormatted === "string" &&
        isToday(vietnamFormatted)
      );
    });

    const allTimes = movieShowtimes
      .map((st) => {
        const vf = st?.start_time?.vietnamFormatted || "";
        const timeMatch = vf.match(/^(\d{2}:\d{2})/);
        return timeMatch ? timeMatch[1] : vf.split(" ")[0] || "";
      })
      .filter(Boolean);

    return [...new Set(allTimes)].sort();
  };

  const movies = useMemo(() => {
    const movieMap = new Map();

    theaterShowtimes.forEach((st) => {
      const movie = st.movie_id;
      if (!movie) return;

      const movieId = movie._id || movie.id;
      if (!movieId || movieMap.has(movieId)) return;

      movieMap.set(movieId, {
        _id: movieId,
        title: movie.title,
        poster_url: movie.poster_url,
        description: movie.description,
        duration: movie.duration,
        genre: movie.genre || [],
      });
    });

    return Array.from(movieMap.values());
  }, [theaterShowtimes]);

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "";
    return `${minutes} phút`;
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="#050814">
        <Center minH="100vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="orange.400" thickness="4px" />
            <Text color="gray.400">Đang tải thông tin rạp...</Text>
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

  if (!theater) {
    return (
      <Box minH="100vh" bg="#050814">
        <Center minH="100vh">
          <Text color="gray.400">Không tìm thấy rạp chiếu</Text>
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

      {/* Hero */}
      <Box
        position="relative"
        py={{ base: 12, md: 18 }}
        borderBottom="1px solid rgba(255,255,255,0.06)"
        bg="linear-gradient(180deg, rgba(8,12,28,0.96), rgba(5,8,20,0.88))"
      >
        <Container maxW="1400px" position="relative" zIndex={2}>
          <VStack align="start" spacing={5}>
            <Button
              leftIcon={<ChevronLeftIcon />}
              variant="ghost"
              color="orange.300"
              _hover={{ bg: "whiteAlpha.100", color: "orange.200" }}
              onClick={() => navigate("/theaters")}
              px={0}
            >
              Quay lại danh sách rạp
            </Button>

            <Badge
              px={4}
              py={1.5}
              borderRadius="full"
              bg="linear-gradient(90deg, #fb923c, #f97316)"
              color="white"
              fontSize="0.82rem"
              fontWeight="700"
            >
              CINEMAGO THEATER
            </Badge>

            <Heading
              color="white"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.05"
              maxW="900px"
            >
              {theater.name}
            </Heading>

            <Text color="gray.300" fontSize={{ base: "md", md: "lg" }}>
              📍 {theater.location || "Chưa cập nhật địa chỉ"}
            </Text>

            <HStack spacing={4} flexWrap="wrap">
              <Badge
                px={4}
                py={2}
                rounded="full"
                bg="whiteAlpha.160"
                color="white"
                fontSize="sm"
              >
                {theater.rooms_count || 0} phòng chiếu
              </Badge>
              <Badge
                px={4}
                py={2}
                rounded="full"
                bg="whiteAlpha.160"
                color="white"
                fontSize="sm"
              >
                {theater.total_seats || 0} ghế
              </Badge>
              <Badge
                px={4}
                py={2}
                rounded="full"
                colorScheme="green"
                fontSize="sm"
              >
                Đang hoạt động
              </Badge>
            </HStack>
          </VStack>
        </Container>
      </Box>

      <Container maxW="1400px" position="relative" zIndex={2} py={10}>
        <VStack align="start" spacing={2} mb={8}>
          <Heading size="xl" color="white">
            Phim đang chiếu tại rạp
          </Heading>
          <Text color="gray.400">
            Hiện có {movies.length} phim đang có suất chiếu tại {theater.name}
          </Text>
        </VStack>

        {movies.length === 0 ? (
          <Center py={20}>
            <VStack spacing={3}>
              <Text color="gray.300" fontSize="lg">
                Không có phim nào đang chiếu tại rạp này
              </Text>
              <Text color="gray.500" fontSize="sm">
                Vui lòng quay lại sau để xem lịch chiếu mới
              </Text>
            </VStack>
          </Center>
        ) : (
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            }}
            gap={7}
          >
            {movies.map((movie) => {
              const movieShowtimes = getMovieShowtimes(movie._id);

              return (
                <Card
                  key={movie._id}
                  bg="rgba(12,18,35,0.88)"
                  color="white"
                  rounded="28px"
                  overflow="hidden"
                  border="1px solid rgba(255,255,255,0.08)"
                  boxShadow="0 18px 50px rgba(0,0,0,0.25)"
                  transition="all 0.3s ease"
                  _hover={{
                    transform: "translateY(-8px)",
                    borderColor: "rgba(251,146,60,0.45)",
                    boxShadow: "0 26px 60px rgba(0,0,0,0.38)",
                  }}
                >
                  <Box position="relative" overflow="hidden">
                    <Image
                      src={movie.poster_url}
                      alt={movie.title}
                      h="420px"
                      w="100%"
                      objectFit="cover"
                      fallbackSrc="https://via.placeholder.com/300x450?text=No+Image"
                    />

                    <Box
                      position="absolute"
                      inset="0"
                      bg="linear-gradient(to top, rgba(5,8,20,0.92), rgba(5,8,20,0.10) 45%, rgba(5,8,20,0.0))"
                    />

                    <Box position="absolute" left={5} bottom={5} right={5}>
                      <Heading size="md" color="white" noOfLines={2}>
                        {movie.title}
                      </Heading>
                      <Text mt={2} fontSize="sm" color="gray.300" noOfLines={1}>
                        {(movie.genre || []).join(" • ")}
                      </Text>
                    </Box>
                  </Box>

                  <CardBody p={5}>
                    <VStack align="stretch" spacing={4}>
                      <HStack justify="space-between" color="gray.300">
                        <HStack spacing={2}>
                          <TimeIcon color="orange.300" />
                          <Text fontSize="sm">{formatDuration(movie.duration)}</Text>
                        </HStack>

                        <Badge
                          rounded="full"
                          px={3}
                          py={1}
                          bg="whiteAlpha.100"
                          color="gray.200"
                          fontWeight="500"
                        >
                          Đang chiếu
                        </Badge>
                      </HStack>

                      <Divider borderColor="whiteAlpha.200" />

                      <VStack align="start" spacing={3} width="100%">
                        <HStack color="gray.300" spacing={2}>
                          <CalendarIcon color="orange.300" />
                          <Text fontSize="sm" fontWeight="600">
                            Suất chiếu hôm nay
                          </Text>
                        </HStack>

                        <Flex wrap="wrap" gap={2}>
                          {movieShowtimes.length > 0 ? (
                            movieShowtimes.map((time) => (
                              <Button
                                key={time}
                                size="sm"
                                h="38px"
                                px={4}
                                rounded="full"
                                bg="whiteAlpha.120"
                                color="white"
                                border="1px solid rgba(255,255,255,0.10)"
                                _hover={{
                                  bg: "orange.400",
                                  borderColor: "orange.400",
                                }}
                                onClick={() => {
                                  const matchingShowtime = theaterShowtimes.find((st) => {
                                    const vf = st?.start_time?.vietnamFormatted || "";
                                    const timeMatch = vf.match(/^(\d{2}:\d{2})/);
                                    const showtimeTime = timeMatch ? timeMatch[1] : "";
                                    return (
                                      showtimeTime === time &&
                                      st.movie_id?._id === movie._id &&
                                      isToday(vf)
                                    );
                                  });

                                  if (matchingShowtime) {
                                    navigate(`/bookings/seats/${matchingShowtime._id}`);
                                  }
                                }}
                              >
                                {time}
                              </Button>
                            ))
                          ) : (
                            <Text fontSize="sm" color="gray.500">
                              Không có suất chiếu hôm nay
                            </Text>
                          )}
                        </Flex>
                      </VStack>

                      <Button
                        w="full"
                        h="52px"
                        rounded="full"
                        bg="linear-gradient(90deg, #f59e0b, #f97316)"
                        color="white"
                        fontWeight="700"
                        rightIcon={<ChevronRightIcon />}
                        _hover={{
                          transform: "translateY(-1px)",
                          boxShadow: "0 14px 28px rgba(249,115,22,0.28)",
                        }}
                        onClick={() => navigate(`/movies/${movie._id}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default TheaterDetailPage;