import {
  Box,
  Container,
  Text,
  Button,
  Checkbox,
  CheckboxGroup,
  Grid,
  Image,
  Badge,
  VStack,
  HStack,
  Card,
  CardBody,
  Heading,
  Divider,
  Spinner,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
} from "@chakra-ui/react";
import {
  StarIcon,
  TimeIcon,
  CalendarIcon,
  SearchIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiService from "../services/apiService";
import MovieRecommendations from "../components/MovieRecommendations";

const Homepage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [featuredList, setFeaturedList] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedShowtimes, setSelectedShowtimes] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiService.getPublic("/api/movies", {}, (data, success) => {
      if (!isMounted) return;

      if (success) {
        const movieList = Array.isArray(data?.data) ? data.data : [];
        setMovies(movieList);
        setFeaturedList(movieList.slice(0, 5));
        setError("");
      } else {
        setError(data?.message || "Không thể tải danh sách phim");
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    apiService.getPublic("/api/showtimes", {}, (data, success) => {
      if (!isMounted) return;
      if (success) {
        setAllShowtimes(Array.isArray(data?.data) ? data.data : []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!featuredList.length) return;

    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredList.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featuredList]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    const cats = params.get("cats") || "";
    setSearchQuery(q);
    setSelectedCategories(cats ? cats.split(",") : []);
  }, [location.search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, selectedShowtimes, searchQuery, movies]);

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "";
    return `${minutes} phút`;
  };

  const isToday = (dateString) => {
    const today = new Date();
    const vietnamToday = new Date(
      today.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );

    const dateMatch = dateString?.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!dateMatch) return false;

    const [day, month, year] = dateMatch[1].split("/");
    const showtimeDate = new Date(year, month - 1, day);

    return showtimeDate.toDateString() === vietnamToday.toDateString();
  };

  const getMovieShowtimes = (movieId) => {
    const movieShowtimes = allShowtimes.filter((st) => {
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

  const getAllUniqueShowtimes = () => {
    const allTimes = allShowtimes
      .filter(
        (st) =>
          st.status === "active" &&
          typeof st?.start_time?.vietnamFormatted === "string" &&
          isToday(st.start_time.vietnamFormatted)
      )
      .map((st) => {
        const timeMatch = st.start_time.vietnamFormatted.match(/^(\d{2}:\d{2})/);
        return timeMatch
          ? timeMatch[1]
          : st.start_time.vietnamFormatted.split(" ")[0];
      });

    return [...new Set(allTimes)].sort();
  };

  const allGenres = useMemo(() => {
    return Array.from(new Set(movies.flatMap((m) => m.genre || [])));
  }, [movies]);

  const filteredMovies = movies.filter((m) => {
    const movieShowtimes = getMovieShowtimes(m._id);
    if (movieShowtimes.length === 0) return false;

    if (selectedCategories.length > 0) {
      const hasGenre = (m.genre || []).some((g) => selectedCategories.includes(g));
      if (!hasGenre) return false;
    }

    if (selectedShowtimes.length > 0) {
      const hasShowtime = selectedShowtimes.some((time) =>
        movieShowtimes.includes(time)
      );
      if (!hasShowtime) return false;
    }

    if (searchQuery) {
      return (m.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / pageSize));

  const pagedMovies = filteredMovies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const featuredMovie = featuredList[featuredIndex];

  return (
    <Box
      minH="100vh"
      bg="#050814"
      position="relative"
      overflow="hidden"
    >
      {/* Background glow */}
      <Box
        position="absolute"
        top="-120px"
        left="-100px"
        w="320px"
        h="320px"
        bg="orange.400"
        opacity={0.08}
        borderRadius="full"
        filter="blur(120px)"
      />
      <Box
        position="absolute"
        bottom="-120px"
        right="-100px"
        w="360px"
        h="360px"
        bg="purple.500"
        opacity={0.08}
        borderRadius="full"
        filter="blur(140px)"
      />

      {/* HERO */}
      <Box
        position="relative"
        minH={{ base: "520px", md: "650px" }}
        overflow="hidden"
      >
        {featuredMovie?.poster_url && (
          <Box
            position="absolute"
            inset="0"
            backgroundImage={`url(${featuredMovie.poster_url})`}
            backgroundSize="cover"
            backgroundPosition="center"
            filter="blur(10px)"
            transform="scale(1.08)"
          />
        )}

        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(180deg, rgba(4,8,20,0.55) 0%, rgba(5,8,20,0.88) 55%, #050814 100%)"
        />
        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(90deg, rgba(5,8,20,0.94) 0%, rgba(5,8,20,0.72) 45%, rgba(5,8,20,0.92) 100%)"
        />

        <Container maxW="1400px" position="relative" zIndex={2} py={{ base: 12, md: 20 }}>
          <Flex
            minH={{ base: "520px", md: "600px" }}
            align="center"
            justify="space-between"
            direction={{ base: "column", lg: "row" }}
            gap={10}
          >
            <VStack
              align="start"
              spacing={6}
              maxW={{ base: "100%", lg: "58%" }}
            >
              <Badge
                px={4}
                py={1.5}
                borderRadius="full"
                bg="linear-gradient(90deg, #fb923c, #f97316)"
                color="white"
                fontSize="0.82rem"
                fontWeight="700"
              >
                CINEMAGO PREMIUM EXPERIENCE
              </Badge>

              <Heading
                color="white"
                fontSize={{ base: "3xl", md: "5xl", xl: "6xl" }}
                lineHeight="1.05"
                maxW="850px"
              >
                Trải nghiệm điện ảnh
                <Text as="span" color="orange.400">
                  {" "}
                  đỉnh cao{" "}
                </Text>
                ngay hôm nay
              </Heading>

              <Text
                color="gray.300"
                fontSize={{ base: "md", md: "lg" }}
                maxW="700px"
                lineHeight="1.9"
              >
                Khám phá các bộ phim hấp dẫn với chất lượng hình ảnh sống động,
                âm thanh bùng nổ và hệ thống đặt vé nhanh chóng tại CineMago.
              </Text>

              {featuredMovie && (
                <VStack align="start" spacing={3}>
                  <Heading size="lg" color="orange.300">
                    {featuredMovie.title}
                  </Heading>

                  <HStack wrap="wrap" spacing={3}>
                    {(featuredMovie.genre || []).slice(0, 3).map((genre) => (
                      <Badge
                        key={genre}
                        px={3}
                        py={1}
                        rounded="full"
                        bg="whiteAlpha.200"
                        color="white"
                        fontWeight="500"
                      >
                        {genre}
                      </Badge>
                    ))}
                    {!!featuredMovie.duration && (
                      <HStack spacing={1} color="gray.300">
                        <TimeIcon />
                        <Text fontSize="sm">
                          {formatDuration(featuredMovie.duration)}
                        </Text>
                      </HStack>
                    )}
                    {!!featuredMovie.rating && (
                      <HStack spacing={1} color="yellow.300">
                        <StarIcon />
                        <Text fontSize="sm">{featuredMovie.rating}</Text>
                      </HStack>
                    )}
                  </HStack>
                </VStack>
              )}

              <HStack spacing={4} pt={2}>
                <Button
                  size="lg"
                  px={8}
                  h="58px"
                  rounded="full"
                  bg="linear-gradient(90deg, #f59e0b, #f97316)"
                  color="white"
                  fontWeight="700"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "0 18px 36px rgba(249,115,22,0.30)",
                  }}
                  onClick={() => {
                    const id = featuredMovie?._id;
                    if (id) navigate(`/movies/${id}`);
                  }}
                >
                  Đặt vé ngay
                </Button>

                <Button
                  size="lg"
                  px={8}
                  h="58px"
                  rounded="full"
                  bg="whiteAlpha.160"
                  color="white"
                  border="1px solid rgba(255,255,255,0.14)"
                  _hover={{ bg: "whiteAlpha.220" }}
                  onClick={() => navigate("/all-movies")}
                >
                  Xem tất cả phim
                </Button>
              </HStack>

              <HStack spacing={3} pt={2}>
                {featuredList.map((_, i) => (
                  <Box
                    key={i}
                    w={i === featuredIndex ? "34px" : "10px"}
                    h="10px"
                    rounded="full"
                    bg={i === featuredIndex ? "orange.400" : "whiteAlpha.400"}
                    transition="all 0.3s ease"
                    cursor="pointer"
                    onClick={() => setFeaturedIndex(i)}
                  />
                ))}
              </HStack>
            </VStack>

            {featuredMovie?.poster_url && (
              <Box
                display={{ base: "none", lg: "block" }}
                position="relative"
                flexShrink={0}
              >
                <Box
                  position="absolute"
                  inset="-20px"
                  bg="orange.400"
                  opacity={0.14}
                  filter="blur(40px)"
                  rounded="30px"
                />
                <Image
                  src={featuredMovie.poster_url}
                  alt={featuredMovie.title}
                  w="360px"
                  h="520px"
                  objectFit="cover"
                  rounded="30px"
                  border="1px solid rgba(255,255,255,0.12)"
                  boxShadow="0 25px 70px rgba(0,0,0,0.45)"
                  position="relative"
                  zIndex={2}
                />
              </Box>
            )}
          </Flex>
        </Container>
      </Box>

      {/* SEARCH + CONTENT */}
      <Container maxW="1400px" position="relative" zIndex={2} pb={14}>
        <Box
          mt={{ base: 0, md: -12 }}
          mb={8}
          p={{ base: 4, md: 6 }}
          rounded="28px"
          bg="rgba(10,15,30,0.72)"
          border="1px solid rgba(255,255,255,0.08)"
          backdropFilter="blur(16px)"
          boxShadow="0 20px 60px rgba(0,0,0,0.30)"
        >
          <Flex
            gap={4}
            direction={{ base: "column", lg: "row" }}
            align={{ base: "stretch", lg: "center" }}
            justify="space-between"
          >
            <VStack align="start" spacing={1}>
              <Heading size="md" color="white">
                Tìm phim hôm nay
              </Heading>
              <Text color="gray.400" fontSize="sm">
                Lọc theo thể loại, khung giờ và tìm nhanh tên phim
              </Text>
            </VStack>

            <InputGroup maxW={{ base: "100%", lg: "420px" }}>
  <InputLeftElement
    pointerEvents="none"
    h="54px"
    w="54px"
    display="flex"
    alignItems="center"
    justifyContent="center"
  >
    <SearchIcon boxSize={5} color="gray.500" />
  </InputLeftElement>

  <Input
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Tìm theo tên phim..."
    h="54px"
    pl="54px"
    pr="20px"
    rounded="full"
    bg="rgba(255,255,255,0.95)"
    color="gray.800"
    border="1px solid rgba(255,255,255,0.12)"
    _placeholder={{ color: "gray.500" }}
    _hover={{
      bg: "white",
    }}
    _focus={{
      bg: "white",
      color: "gray.800",
      borderColor: "orange.400",
      boxShadow: "0 0 0 1px #fb923c",
    }}
  />
</InputGroup>
          </Flex>
        </Box>

        <Flex gap={7} align="start" direction={{ base: "column", xl: "row" }}>
          {/* SIDEBAR */}
          <Box
            w={{ base: "100%", xl: "290px" }}
            flexShrink={0}
            position={{ base: "static", xl: "sticky" }}
            top="24px"
          >
            <Card
              bg="rgba(10,15,30,0.78)"
              color="white"
              border="1px solid rgba(255,255,255,0.08)"
              rounded="28px"
              backdropFilter="blur(16px)"
              boxShadow="0 18px 50px rgba(0,0,0,0.28)"
            >
              <CardBody p={6}>
                <VStack align="stretch" spacing={7}>
                  <HStack justify="space-between">
                    <Heading size="md" color="orange.400">
                      Bộ lọc phim
                    </Heading>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "orange.300", bg: "whiteAlpha.100" }}
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedShowtimes([]);
                        setSearchQuery("");
                      }}
                      isDisabled={
                        selectedCategories.length === 0 &&
                        selectedShowtimes.length === 0 &&
                        !searchQuery
                      }
                    >
                      Xóa
                    </Button>
                  </HStack>

                  <Box>
                    <Text
                      color="gray.200"
                      fontWeight="700"
                      mb={3}
                      fontSize="sm"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Thể loại
                    </Text>

                    <CheckboxGroup
                      colorScheme="orange"
                      value={selectedCategories}
                      onChange={(vals) =>
                        setSelectedCategories(Array.isArray(vals) ? vals : [vals])
                      }
                    >
                      <VStack align="stretch" spacing={2.5}>
                        {allGenres.map((genre) => (
                          <Checkbox key={genre} value={genre} color="gray.300">
                            <Text fontSize="sm">{genre}</Text>
                          </Checkbox>
                        ))}
                      </VStack>
                    </CheckboxGroup>
                  </Box>

                  <Divider borderColor="whiteAlpha.200" />

                  <Box>
                    <Text
                      color="gray.200"
                      fontWeight="700"
                      mb={3}
                      fontSize="sm"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Suất chiếu hôm nay
                    </Text>

                    <CheckboxGroup
                      colorScheme="orange"
                      value={selectedShowtimes}
                      onChange={(vals) =>
                        setSelectedShowtimes(Array.isArray(vals) ? vals : [vals])
                      }
                    >
                      <VStack align="stretch" spacing={2.5}>
                        {getAllUniqueShowtimes().map((showtime) => (
                          <Checkbox key={showtime} value={showtime} color="gray.300">
                            <Text fontSize="sm">{showtime}</Text>
                          </Checkbox>
                        ))}
                      </VStack>
                    </CheckboxGroup>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* MAIN */}
          <Box flex="1" w="100%">
            <Flex
              justify="space-between"
              align={{ base: "start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={3}
              mb={6}
            >
              <VStack align="start" spacing={1}>
                <Heading size="xl" color="white">
                  Phim hôm nay
                </Heading>
                <Text color="gray.400">
                  {filteredMovies.length} phim đang có suất chiếu trong ngày
                </Text>
              </VStack>
            </Flex>

            {loading && (
              <Box textAlign="center" py={16}>
                <Spinner color="orange.400" size="xl" thickness="4px" />
                <Text color="gray.400" mt={4}>
                  Đang tải danh sách phim...
                </Text>
              </Box>
            )}

            {!!error && !loading && (
              <Text textAlign="center" color="red.300" py={14}>
                {error}
              </Text>
            )}

            {!loading && !error && (
              <>
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                    xl: "repeat(3, 1fr)",
                  }}
                  gap={7}
                >
                  {pagedMovies.map((movie, idx) => {
                    const showtimes = getMovieShowtimes(movie._id);

                    return (
                      <Card
                        key={movie._id || idx}
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
                            transition="transform 0.4s ease"
                            _groupHover={{ transform: "scale(1.04)" }}
                          />

                          <Box
                            position="absolute"
                            inset="0"
                            bg="linear-gradient(to top, rgba(5,8,20,0.92), rgba(5,8,20,0.10) 45%, rgba(5,8,20,0.0))"
                          />

                          {movie.rating && (
                            <Badge
                              position="absolute"
                              top={4}
                              left={4}
                              px={3}
                              py={1.5}
                              rounded="full"
                              bg="rgba(251,146,60,0.95)"
                              color="white"
                              display="flex"
                              alignItems="center"
                              gap={1.5}
                              fontSize="0.82rem"
                            >
                              <StarIcon />
                              {movie.rating}
                            </Badge>
                          )}

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
                                <Text fontSize="sm">
                                  {formatDuration(movie.duration)}
                                </Text>
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

                            <VStack align="start" spacing={3}>
                              <HStack spacing={2} color="gray.300">
                                <CalendarIcon color="orange.300" />
                                <Text fontSize="sm" fontWeight="600">
                                  Suất chiếu hôm nay
                                </Text>
                              </HStack>

                              <Stack direction="row" wrap="wrap" spacing={2}>
                                {showtimes.length > 0 ? (
                                  showtimes.map((time) => (
                                    <Box
                                      key={time}
                                      px={3}
                                      py={1.5}
                                      rounded="full"
                                      bg="whiteAlpha.120"
                                      border="1px solid rgba(255,255,255,0.08)"
                                      fontSize="sm"
                                      color="white"
                                    >
                                      {time}
                                    </Box>
                                  ))
                                ) : (
                                  <Text fontSize="sm" color="gray.500">
                                    Không có suất chiếu hôm nay
                                  </Text>
                                )}
                              </Stack>
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

                {pagedMovies.length === 0 && (
                  <Box
                    textAlign="center"
                    py={16}
                    rounded="28px"
                    bg="rgba(12,18,35,0.72)"
                    border="1px solid rgba(255,255,255,0.06)"
                    mt={4}
                  >
                    <Text color="gray.300" fontSize="lg">
                      Không tìm thấy phim phù hợp
                    </Text>
                    <Text color="gray.500" mt={2}>
                      Thử đổi từ khóa tìm kiếm hoặc bộ lọc
                    </Text>
                  </Box>
                )}

                <HStack justify="center" spacing={3} mt={10} flexWrap="wrap">
                  <Button
                    size="md"
                    h="44px"
                    px={5}
                    rounded="full"
                    bg="whiteAlpha.100"
                    color="gray.300"
                    border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: "orange.400", color: "white" }}
                    _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Trước
                  </Button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      size="md"
                      minW="44px"
                      h="44px"
                      rounded="full"
                      bg={currentPage === i + 1 ? "orange.400" : "whiteAlpha.100"}
                      color="white"
                      border="1px solid rgba(255,255,255,0.08)"
                      _hover={{
                        bg: "orange.400",
                        color: "white",
                      }}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    size="md"
                    h="44px"
                    px={5}
                    rounded="full"
                    bg="whiteAlpha.100"
                    color="gray.300"
                    border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: "orange.400", color: "white" }}
                    _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages || filteredMovies.length === 0}
                  >
                    Sau
                  </Button>
                </HStack>
              </>
            )}
          </Box>
        </Flex>
      </Container>

      <MovieRecommendations />
    </Box>
  );
};

export default Homepage;