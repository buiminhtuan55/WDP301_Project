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
  Select,
  Input,
  InputGroup,
  InputLeftElement,
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

const AllMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiService.getPublic("/api/movies", {}, (data, success) => {
      if (!isMounted) return;

      if (success) {
        setMovies(Array.isArray(data?.data) ? data.data : []);
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
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setSearchQuery(q);
  }, [location.search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, sortBy, searchQuery]);

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "";
    return `${minutes} phút`;
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "";

    if (typeof dateObj === "object" && dateObj.utc) {
      const date = new Date(dateObj.utc);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("vi-VN");
    }

    if (typeof dateObj === "string" || typeof dateObj === "number") {
      const date = new Date(dateObj);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("vi-VN");
    }

    return "";
  };

  const getDateValue = (dateObj) => {
    if (!dateObj) return 0;
    if (typeof dateObj === "object" && dateObj.utc) {
      return new Date(dateObj.utc).getTime();
    }
    if (typeof dateObj === "string" || typeof dateObj === "number") {
      return new Date(dateObj).getTime();
    }
    return 0;
  };

  const allGenres = useMemo(
    () => Array.from(new Set(movies.flatMap((m) => m.genre || []))),
    [movies]
  );

  const filteredMovies = movies.filter((m) => {
    if (selectedCategories.length > 0) {
      const hasGenre = (m.genre || []).some((g) => selectedCategories.includes(g));
      if (!hasGenre) return false;
    }

    if (searchQuery) {
      return (m.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return getDateValue(b.release_date) - getDateValue(a.release_date);
      case "oldest":
        return getDateValue(a.release_date) - getDateValue(b.release_date);
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "");
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "");
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedMovies.length / pageSize);

  const pagedMovies = sortedMovies.slice(
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

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      navigate(`/all-movies?${params.toString()}`);
    }
  };

  return (
    <Box minH="100vh" bg="#050814" position="relative" overflow="hidden">
      {/* Glow background */}
      <Box
        position="absolute"
        top="-120px"
        left="-120px"
        w="360px"
        h="360px"
        bg="orange.400"
        opacity={0.08}
        borderRadius="full"
        filter="blur(120px)"
      />
      <Box
        position="absolute"
        right="-120px"
        bottom="-120px"
        w="360px"
        h="360px"
        bg="purple.500"
        opacity={0.08}
        borderRadius="full"
        filter="blur(140px)"
      />

      {/* Hero header */}
      <Box
        position="relative"
        py={{ base: 12, md: 16 }}
        mb={4}
        borderBottom="1px solid rgba(255,255,255,0.06)"
        bg="linear-gradient(180deg, rgba(8,12,28,0.95), rgba(5,8,20,0.88))"
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
              CINEMAGO MOVIES
            </Badge>

            <Heading
              color="white"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.05"
            >
              Khám phá
              <Text as="span" color="orange.400">
                {" "}
                tất cả phim{" "}
              </Text>
              đang có tại CinemaGo
            </Heading>

            <Text color="gray.300" maxW="760px" fontSize={{ base: "md", md: "lg" }}>
              Tìm kiếm, lọc thể loại và sắp xếp danh sách phim theo cách bạn muốn
              để chọn ngay bộ phim phù hợp cho buổi xem hôm nay.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="1400px" position="relative" zIndex={2} pb={14}>
        <Flex gap={7} align="start" direction={{ base: "column", xl: "row" }}>
          {/* Sidebar */}
          <Box
            w={{ base: "100%", xl: "300px" }}
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
                        setSearchQuery("");
                        setSortBy("newest");
                      }}
                      isDisabled={
                        selectedCategories.length === 0 &&
                        !searchQuery &&
                        sortBy === "newest"
                      }
                    >
                      Xóa
                    </Button>
                  </HStack>

                  {/* Search */}
                  <Box>
                    <Text
                      color="gray.200"
                      fontWeight="700"
                      mb={3}
                      fontSize="sm"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Tìm kiếm
                    </Text>

                    <InputGroup>
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
                        placeholder="Tìm phim..."
                        h="54px"
                        pl="54px"
                        pr="18px"
                        rounded="full"
                        bg="rgba(255,255,255,0.95)"
                        color="gray.800"
                        border="1px solid rgba(255,255,255,0.12)"
                        _placeholder={{ color: "gray.500" }}
                        _hover={{ bg: "white" }}
                        _focus={{
                          bg: "white",
                          borderColor: "orange.400",
                          boxShadow: "0 0 0 1px #fb923c",
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                      />
                    </InputGroup>
                  </Box>

                  <Divider borderColor="whiteAlpha.200" />

                  {/* Sort */}
                  <Box>
                    <Text
                      color="gray.200"
                      fontWeight="700"
                      mb={3}
                      fontSize="sm"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Sắp xếp
                    </Text>

                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      h="52px"
                      rounded="18px"
                      bg="rgba(255,255,255,0.08)"
                      border="1px solid rgba(255,255,255,0.10)"
                      color="white"
                      _focus={{
                        borderColor: "orange.400",
                        boxShadow: "0 0 0 1px #fb923c",
                      }}
                    >
                      <option style={{ background: "#111827", color: "#fff" }} value="newest">
                        Mới nhất
                      </option>
                      <option style={{ background: "#111827", color: "#fff" }} value="oldest">
                        Cũ nhất
                      </option>
                      <option style={{ background: "#111827", color: "#fff" }} value="title_asc">
                        Tên A-Z
                      </option>
                      <option style={{ background: "#111827", color: "#fff" }} value="title_desc">
                        Tên Z-A
                      </option>
                    </Select>
                  </Box>

                  <Divider borderColor="whiteAlpha.200" />

                  {/* Categories */}
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

                    {!loading && !error && (
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
                    )}
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* Main content */}
          <Box flex="1" w="100%">
            <Flex
              justify="space-between"
              align={{ base: "start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={3}
              mb={6}
            >
              <VStack align="start" spacing={1}>
                <Heading as="h2" size="xl" color="white">
                  Tất cả phim
                </Heading>
                <Text color="gray.400">
                  Tìm thấy {sortedMovies.length} phim phù hợp
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

            {!loading && !error && sortedMovies.length === 0 && (
              <Box
                textAlign="center"
                py={16}
                rounded="28px"
                bg="rgba(12,18,35,0.72)"
                border="1px solid rgba(255,255,255,0.06)"
              >
                <Text color="gray.300" fontSize="lg">
                  Không tìm thấy phim nào
                </Text>
                <Text color="gray.500" mt={2}>
                  Hãy thử đổi từ khóa hoặc bộ lọc
                </Text>
              </Box>
            )}

            {!loading && !error && sortedMovies.length > 0 && (
              <>
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                    xl: "repeat(4, 1fr)",
                  }}
                  gap={7}
                >
                  {pagedMovies.map((movie, idx) => (
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

                          {movie.release_date && formatDate(movie.release_date) && (
                            <HStack spacing={2} color="gray.300">
                              <CalendarIcon color="orange.300" />
                              <Text fontSize="sm">{formatDate(movie.release_date)}</Text>
                            </HStack>
                          )}

                          <Divider borderColor="whiteAlpha.200" />

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
                  ))}
                </Grid>

                {totalPages > 1 && (
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
                        _hover={{ bg: "orange.400", color: "white" }}
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
                      isDisabled={currentPage === totalPages}
                    >
                      Sau
                    </Button>
                  </HStack>
                )}
              </>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default AllMoviesPage;