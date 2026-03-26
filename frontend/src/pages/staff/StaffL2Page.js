import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Icon,
  Spinner,
  SimpleGrid,
  Text,
  Input,
  Button,
  HStack,
  Checkbox,
  useToast,
  Center,
  Wrap,
  WrapItem,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FaFilm, FaClock, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Navbar/SidebarStaff";
import apiService from "../../services/apiService";

const StaffL2Page = () => {
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingShowtime, setLoadingShowtime] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // Kiểm tra authentication và authorization
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      
      if (!token) {
        toast({
          title: "Yêu cầu đăng nhập",
          description: "Vui lòng đăng nhập để truy cập trang này",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        navigate("/login");
        return false;
      }

      // Lấy role từ nhiều nguồn
      let role = "";
      
      // Thử lấy từ userRole
      role = (localStorage.getItem("userRole") || "").toLowerCase();
      
      // Nếu không có, thử lấy từ role object
      if (!role) {
        try {
          const roleData = JSON.parse(localStorage.getItem("role"));
          role = (roleData?.role || "").toLowerCase();
        } catch (e) {
          // Ignore
        }
      }
      
      // Nếu vẫn không có, thử lấy từ staff object
      if (!role) {
        try {
          const staffData = JSON.parse(localStorage.getItem("staff"));
          role = (staffData?.role || "").toLowerCase();
        } catch (e) {
          // Ignore
        }
      }

      // Kiểm tra role có phải staff không
      if (role !== "lv1" && role !== "lv2" && role !== "admin") {
        toast({
          title: "Không có quyền truy cập",
          description: "Bạn không có quyền truy cập trang này",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/login");
        return false;
      }

      // Nếu là lv1, redirect về trang l1
      if (role === "lv1") {
        toast({
          title: "Chuyển hướng",
          description: "Bạn đang được chuyển về trang quầy của bạn",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
        navigate("/staff/l1", { replace: true });
        return false;
      }

      // Nếu là admin, cho phép truy cập
      if (role === "admin") {
        setIsAuthorized(true);
        return true;
      }

      // Nếu là lv2, cho phép truy cập
      if (role === "lv2") {
        setIsAuthorized(true);
        return true;
      }

      return false;
    };

    if (!checkAuth()) {
      return;
    }

    // Lưu staffReturnPage ngay khi vào trang staff l2
    sessionStorage.setItem("staffReturnPage", "/staff/l2");
    localStorage.setItem("staffReturnPage", "/staff/l2");

    if (isAuthorized) {
      apiService.get("/api/movies", {}, (data, success) => {
        if (success && data?.data) setMovies(data.data);
        setLoading(false);
      });
      apiService.get("/api/showtimes", {}, (data, success) => {
        if (success && data?.data) setShowtimes(data.data);
        setLoadingShowtime(false);
      });
    }
  }, [isAuthorized, navigate, toast]);

  // Nếu chưa authorized, hiển thị loading
  if (!isAuthorized) {
    return (
      <Center minH="100vh" bg="#181a20">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

  const formatGenreLabel = (g) =>
    String(g)
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map(
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      )
      .join(" ");

  const allGenres = Array.from(
    new Set(movies.flatMap((m) => m.genre || []))
  ).sort((a, b) => String(a).localeCompare(String(b), "vi"));

  // Lọc phim theo tên và thể loại
  const filteredMovies = movies.filter((movie) => {
    const matchName = movie.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre =
      selectedGenres.length === 0 ||
      (movie.genre && movie.genre.some((g) => selectedGenres.includes(g)));
    return matchName && matchGenre;
  });

  const handleGenreChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleClearGenres = () => setSelectedGenres([]);

  // Kiểm tra xem showtime có phải hôm nay và chưa qua không
  const isTodayAndNotPassed = (startTimeObj) => {
    if (!startTimeObj) return false;

    let dateString;

    // Xử lý nếu start_time là object có vietnam/utc
    if (typeof startTimeObj === "object" && startTimeObj !== null) {
      dateString = startTimeObj.vietnam || startTimeObj.utc || startTimeObj.vietnamFormatted;
    } else if (typeof startTimeObj === "string") {
      dateString = startTimeObj;
    }

    if (!dateString) return false;

    // Parse date từ vietnamFormatted nếu có (format: "09:30:00 14/10/2025")
    let showtimeDate;
    if (typeof dateString === "string" && dateString.includes("/")) {
      // Format: "09:30:00 14/10/2025"
      const dateMatch = dateString.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('/');
        const timeMatch = dateString.match(/(\d{2}:\d{2}):\d{2}/);
        if (timeMatch) {
          const [hours, minutes] = timeMatch[1].split(':');
          showtimeDate = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes));
        } else {
          showtimeDate = new Date(year, month - 1, day);
        }
      } else {
        showtimeDate = new Date(dateString);
      }
    } else {
      showtimeDate = new Date(dateString);
    }

    if (isNaN(showtimeDate.getTime())) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Kiểm tra xem có phải hôm nay không
    const isToday = (
      showtimeDate.getDate() === today.getDate() &&
      showtimeDate.getMonth() === today.getMonth() &&
      showtimeDate.getFullYear() === today.getFullYear()
    );

    if (!isToday) return false;

    // Kiểm tra xem showtime đã qua chưa (so sánh với thời gian hiện tại)
    return showtimeDate > now;
  };

  // Lấy showtime cho từng movie (CHỈ HÔM NAY VÀ CHƯA QUA)
  const getShowtimesForMovie = (movieId) => {
    return showtimes
      .filter((st) => {
        // Chỉ lấy showtime active
        if (st.status !== 'active') return false;
        
        const matchMovie = st.movie_id?._id === movieId;
        const isTodayAndNotPassedShowtime = isTodayAndNotPassed(st.start_time);
        return matchMovie && isTodayAndNotPassedShowtime;
      })
      .map((st) => {
        let timeStr = "";

        if (typeof st.start_time === "object" && st.start_time !== null) {
          const dateStr = st.start_time.vietnamFormatted || st.start_time.vietnam || st.start_time.utc || "";
          if (typeof dateStr === "string") {
            // Parse từ format "09:30:00 14/10/2025"
            const timeMatch = dateStr.match(/(\d{2}:\d{2})/);
            if (timeMatch) {
              timeStr = timeMatch[1];
            } else if (dateStr.length >= 16) {
              timeStr = dateStr.slice(11, 16);
            }
          }
        } else if (
          typeof st.start_time === "string" &&
          st.start_time.length >= 16
        ) {
          // Parse từ format "09:30:00 14/10/2025"
          const timeMatch = st.start_time.match(/(\d{2}:\d{2})/);
          if (timeMatch) {
            timeStr = timeMatch[1];
          } else {
            timeStr = st.start_time.slice(11, 16);
          }
        }

        return { ...st, time: timeStr };
      })
      .filter((st) => st.time)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  return (
    <Flex minH="100vh" bg="#181a20" color="white">
      {/* Sidebar */}
      <Sidebar userRole="lv2" />

      {/* Main Content */}
      <Box flex="1" p={{ base: 4, md: 8 }} overflow="auto">
        <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={4} mb={6}>
          <Heading color="orange.400" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="wide">
            Quầy bán vé & bắp nước
          </Heading>
        </Flex>

        <Flex justify="center">
          <Tabs
            variant="soft-rounded"
            colorScheme="orange"
            w="100%"
            maxW="1280px"
          >
            <TabList
              bg="#23242a"
              p={2}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              flexWrap="wrap"
              gap={1}
            >
              <Tab
                borderRadius="lg"
                _selected={{ bg: "orange.500", color: "white" }}
                color="gray.400"
                fontWeight="semibold"
              >
                <Icon as={FaFilm} mr={2} />
                Danh sách phim
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0} pt={6}>
                <Box
                  bg="#23242a"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="whiteAlpha.100"
                  p={{ base: 4, md: 6 }}
                  boxShadow="xl"
                >
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    Tìm kiếm
                  </Text>
                  <InputGroup maxW="420px" mb={5}>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.500" />
                    </InputLeftElement>
                    <Input
                      pl={10}
                      placeholder="Tìm kiếm tên phim..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      bg="#1a1d26"
                      borderWidth="1px"
                      borderColor="whiteAlpha.200"
                      color="white"
                      _placeholder={{ color: "gray.500" }}
                      _hover={{ borderColor: "whiteAlpha.300" }}
                      _focus={{
                        borderColor: "orange.400",
                        boxShadow: "0 0 0 1px var(--chakra-colors-orange-400)",
                      }}
                    />
                  </InputGroup>

                  <Flex align="center" justify="space-between" flexWrap="wrap" gap={2} mb={3}>
                    <Text fontSize="sm" color="gray.500">
                      Thể loại
                    </Text>
                    {selectedGenres.length > 0 && (
                      <Button
                        size="xs"
                        colorScheme="orange"
                        variant="ghost"
                        onClick={handleClearGenres}
                      >
                        Xóa chọn
                      </Button>
                    )}
                  </Flex>
                  <Box
                    bg="#1a1d26"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="whiteAlpha.100"
                    p={4}
                    mb={6}
                  >
                    <Wrap spacing={3} shouldWrapChildren>
                      {allGenres.map((genre) => (
                        <WrapItem key={genre}>
                          <Checkbox
                            colorScheme="orange"
                            isChecked={selectedGenres.includes(genre)}
                            onChange={() => handleGenreChange(genre)}
                            spacing={2}
                            sx={{
                              ".chakra-checkbox__label": {
                                fontSize: "sm",
                                color: "gray.300",
                              },
                            }}
                          >
                            {formatGenreLabel(genre)}
                          </Checkbox>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>

                  {loading || loadingShowtime ? (
                    <Flex justify="center" align="center" minH="240px">
                      <Spinner color="orange.400" size="lg" />
                    </Flex>
                  ) : (
                    <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
                      {filteredMovies.map((movie) => {
                        const movieShowtimes = getShowtimesForMovie(movie._id);
                        return (
                          <Box
                            key={movie._id}
                            bg="#181a20"
                            borderRadius="xl"
                            overflow="hidden"
                            borderWidth="1px"
                            borderColor="whiteAlpha.100"
                            display="flex"
                            flexDirection="column"
                            transition="transform 0.2s, box-shadow 0.2s"
                            _hover={{
                              transform: "translateY(-4px)",
                              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                              borderColor: "orange.500",
                            }}
                          >
                            <Box h="260px" bg="#111" overflow="hidden">
                              {movie.poster_url ? (
                                <img
                                  src={movie.poster_url}
                                  alt={movie.title}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                              ) : (
                                <Flex align="center" justify="center" h="100%">
                                  <Text color="gray.600" fontSize="sm">
                                    Chưa có poster
                                  </Text>
                                </Flex>
                              )}
                            </Box>
                            <Box p={4} flex="1" display="flex" flexDirection="column">
                              <Heading size="sm" color="orange.300" mb={2} noOfLines={2}>
                                {movie.title}
                              </Heading>
                              <Text color="gray.400" fontSize="sm" mb={2} noOfLines={2}>
                                {(movie.genre || []).map(formatGenreLabel).join(" · ")}
                              </Text>
                              <Flex align="center" color="gray.500" fontSize="sm" mb={3}>
                                <Icon as={FaClock} mr={2} />
                                {movie.duration || "?"} phút
                              </Flex>
                              <Box mt="auto">
                                <Flex align="center" color="gray.500" fontSize="sm" mb={2}>
                                  <Icon as={FaCalendarAlt} mr={2} />
                                  Suất chiếu hôm nay
                                </Flex>
                                <HStack spacing={2} flexWrap="wrap" align="flex-start">
                                  {movieShowtimes.length > 0 ? (
                                    movieShowtimes.map((st) => (
                                      <Button
                                        key={st._id + st.time}
                                        size="sm"
                                        colorScheme="orange"
                                        variant="outline"
                                        borderRadius="md"
                                        _hover={{ bg: "orange.500", color: "white" }}
                                        onClick={() =>
                                          navigate("/staff/ticket", {
                                            state: { movie, time: st.time, showtime: st },
                                          })
                                        }
                                      >
                                        {st.time}
                                      </Button>
                                    ))
                                  ) : (
                                    <Text color="gray.600" fontSize="sm">
                                      Không có suất chiếu hôm nay
                                    </Text>
                                  )}
                                </HStack>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  )}
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Box>
    </Flex>
  );
};

export default StaffL2Page;
