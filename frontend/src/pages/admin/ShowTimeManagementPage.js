import { useEffect, useState, useMemo } from "react"
import {
  Box,
  Heading,
  Button,
  Spinner,
  Text,
  Flex,
  HStack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Input,
  IconButton,
  Tooltip,
  InputGroup,
  InputLeftElement,
  Badge,
  VStack,
  Center,
} from "@chakra-ui/react"
import { FaBan, FaCheckCircle, FaSearch } from "react-icons/fa"
import { AddIcon } from "@chakra-ui/icons"
import SidebarAdmin from "../Navbar/SidebarAdmin"
import { useAdminAuth } from "../../hooks/useAdminAuth"

export default function ShowtimeManagementPage() {
  const isAuthorized = useAdminAuth();
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddOpen, setAddOpen] = useState(false)
  const [newShowtime, setNewShowtime] = useState({
    movie_id: "",
    room_id: "",
    date: "",
    time: "",
  })
  const [adding, setAdding] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchName, setSearchName] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const toast = useToast()

  // Logic lọc phòng hoạt động
  const activeRooms = useMemo(() => {
    return Array.isArray(rooms) ? rooms.filter(r => r && (r.status === "active" || r.status === undefined)) : []
  }, [rooms])

  // 🔹 Lấy danh sách suất chiếu
  const fetchShowtimes = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("http://localhost:5000/api/showtimes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!res.ok) throw new Error("Không thể tải danh sách suất chiếu.")
      const data = await res.json()

      const sortedData = (data.data || []).sort((a, b) => {
        return new Date(b.start_time.utc) - new Date(a.start_time.utc)
      })

      setShowtimes(sortedData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Lấy danh sách phim và phòng
  const fetchMoviesAndRooms = async () => {
    const token = localStorage.getItem("token")
    try {
      // Fetch movies
      const movieRes = await fetch("http://localhost:5000/api/movies", {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (movieRes.ok) {
        const movieData = await movieRes.json()
        setMovies(movieData.data || [])
      }

      // Fetch rooms
      const roomRes = await fetch("http://localhost:5000/api/rooms/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          page: 1,
          pageSize: 100
        })
      })

      if (roomRes.ok) {
        const roomData = await roomRes.json()
        const roomList = roomData.list || roomData.data || []
        setRooms(roomList)
      } else {
        toast({
          title: "Không thể tải danh sách phòng",
          description: "Vui lòng kiểm tra kết nối API",
          status: "warning",
          duration: 3000
        })
      }
    } catch (err) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: err.message,
        status: "error",
        duration: 3000
      })
    }
  }

  useEffect(() => {
    if (!isAuthorized) return;
    fetchShowtimes()
    fetchMoviesAndRooms()
  }, [isAuthorized])

  // Reset trang khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1)
  }, [searchName, filterStatus, startDate, endDate])

  // 🔹 Kiểm tra xem có thể chỉnh sửa không (15 phút trước khi chiếu)
  const canEdit = (showtime) => {
    if (!showtime?.start_time?.utc) return false

    const now = new Date()
    const startTime = new Date(showtime.start_time.utc)
    const diffMinutes = (startTime - now) / (1000 * 60)

    return diffMinutes > 15
  }

  // 🔹 Mở modal thêm
  const openAdd = () => setAddOpen(true)
  const closeAdd = () => {
    setAddOpen(false)
    setNewShowtime({
      movie_id: "",
      room_id: "",
      date: "",
      time: "",
    })
  }

  // 🔹 Thêm suất chiếu mới
  const addShowtime = async () => {
    if (!newShowtime.movie_id || !newShowtime.room_id || !newShowtime.date || !newShowtime.time) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        status: "error"
      })
      return
    }

    setAdding(true)
    const token = localStorage.getItem("token")

    const payload = {
      movie_id: String(newShowtime.movie_id).trim(),
      room_id: String(newShowtime.room_id).trim(),
      date: newShowtime.date,
      time: newShowtime.time,
    }

    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id)

    if (!isValidObjectId(payload.movie_id)) {
      toast({
        title: "Lỗi",
        description: "ID phim không hợp lệ",
        status: "error"
      })
      setAdding(false)
      return
    }

    if (!isValidObjectId(payload.room_id)) {
      toast({
        title: "Lỗi",
        description: "ID phòng không hợp lệ",
        status: "error"
      })
      setAdding(false)
      return
    }

    try {
      const res = await fetch("http://localhost:5000/api/showtimes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })

      const responseText = await res.text()

      if (!res.ok) {
        let err
        try {
          err = JSON.parse(responseText)
        } catch {
          err = { message: responseText }
        }
        throw new Error(err.message || "Không thể thêm suất chiếu.")
      }

      toast({
        title: "Thêm suất chiếu thành công!",
        status: "success",
        duration: 3000
      })

      fetchShowtimes()
      closeAdd()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 5000
      })
    } finally {
      setAdding(false)
    }
  }

  // 🔹 Hủy/Kích hoạt suất chiếu
  const toggleShowtimeStatus = async (showtime) => {
    if (!canEdit(showtime)) {
      toast({
        title: "Không thể thay đổi",
        description: "Chỉ có thể thay đổi trạng thái trước 15 phút khi bắt đầu",
        status: "warning",
        duration: 3000,
      })
      return
    }

    setCanceling(true)
    const token = localStorage.getItem("token")

    const newStatus = showtime.status === "inactive" ? "active" : "inactive"

    try {
      const res = await fetch(`http://localhost:5000/api/showtimes/${showtime._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus })
      })

      const responseText = await res.text()

      if (!res.ok) {
        let err
        try {
          err = JSON.parse(responseText)
        } catch {
          err = { message: responseText }
        }
        throw new Error(err.message || "Không thể thay đổi trạng thái suất chiếu.")
      }

      toast({
        title: newStatus === "inactive" ? "Đã hủy suất chiếu!" : "Đã kích hoạt lại suất chiếu!",
        status: "success",
        duration: 3000
      })

      fetchShowtimes()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 5000
      })
    } finally {
      setCanceling(false)
    }
  }

  // 🔹 Hiển thị trạng thái suất chiếu
  const getStatus = (showtime) => {
    if (!showtime?.start_time?.utc || !showtime?.end_time?.utc) {
      return { label: "Không xác định", color: "gray.400" }
    }

    const now = new Date()
    const startTime = new Date(showtime.start_time.utc)
    const endTime = new Date(showtime.end_time.utc)

    // Qua giờ kết thúc → Hiển thị "Kết thúc" bất kể status
    if (now > endTime) {
      return { label: "Kết thúc", color: "gray.500" }
    }

    // Trong thời gian (chưa kết thúc) và status inactive → Đã hủy
    if (showtime?.status === "inactive") {
      return { label: "Đã hủy", color: "red.400" }
    }

    // Chưa bắt đầu
    if (now < startTime) {
      return { label: "Sắp chiếu", color: "blue.400" }
    }

    // Đang trong thời gian chiếu
    if (now >= startTime && now <= endTime) {
      return { label: "Đang chiếu", color: "green.400" }
    }

    return { label: "Không xác định", color: "gray.400" }
  }

  // 🔹 Format ngày giờ hiển thị
  const formatDateTime = (showtime) => {
    if (!showtime?.start_time?.vietnamFormatted) {
      return "Không xác định"
    }

    const parts = showtime.start_time.vietnamFormatted.split(" ")
    const time = parts[0]
    const date = parts[1]
    const shortTime = time.split(":").slice(0, 2).join(":")

    return `${date} - ${shortTime}`
  }

  // 🔹 Lọc và tìm kiếm suất chiếu
  const filteredShowtimes = showtimes.filter((showtime) => {
    // Lọc theo tên phim
    if (searchName) {
      const movieTitle = showtime.movie_id?.title || ""
      if (!movieTitle.toLowerCase().includes(searchName.toLowerCase())) {
        return false
      }
    }

    // Lọc theo khoảng ngày
    if (startDate || endDate) {
      const showtimeDate = new Date(showtime.start_time.utc)

      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (showtimeDate < start) return false
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (showtimeDate > end) return false
      }
    }

    // Lọc theo trạng thái
    if (filterStatus !== "all") {
      const status = getStatus(showtime).label
      const statusMap = {
        cancelled: "Đã hủy",
        upcoming: "Sắp chiếu",
        ongoing: "Đang chiếu",
        ended: "Kết thúc"
      }

      if (status !== statusMap[filterStatus]) {
        return false
      }
    }

    return true
  })

  // 🔹 Phân trang
  const totalPages = Math.ceil(filteredShowtimes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = filteredShowtimes.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Nếu không có quyền truy cập (từ hook useAdminAuth)
  if (!isAuthorized) {
    return (
      <Center minH="100vh" bg="#0f1117">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

  return (
    <Flex minH="100vh" bg="#181a20" color="white">
      <SidebarAdmin />

      {/* Main Content */}
      <Box flex="1" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading color="orange.400">Quản lý suất chiếu</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="orange"
            onClick={openAdd}
            _hover={{ transform: "scale(1.05)" }}
            transition="0.2s"
          >
            Thêm suất chiếu
          </Button>
        </Flex>

        {/* Filters */}
        <VStack spacing={4} mb={6} align="stretch">
          <HStack spacing={4} flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Tìm theo tên phim..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                bg="gray.800"
                color="white"
                border="none"
                _focus={{ bg: "gray.700" }}
              />
            </InputGroup>

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              maxW="200px"
              bg="#181a20"
              color="#fff"
              border="1px solid #23242a"
            >
              <option value="all" style={{ background: "#181a20", color: "#fff" }}>
                Tất cả trạng thái
              </option>
              <option value="upcoming" style={{ background: "#181a20", color: "#fff" }}>
                Sắp chiếu
              </option>
              <option value="ongoing" style={{ background: "#181a20", color: "#fff" }}>
                Đang chiếu
              </option>
              <option value="ended" style={{ background: "#181a20", color: "#fff" }}>
                Kết thúc
              </option>
              <option value="cancelled" style={{ background: "#181a20", color: "#fff" }}>
                Đã hủy
              </option>
            </Select>
          </HStack>

          <HStack spacing={4} flexWrap="wrap">
            <FormControl maxW="250px">
              <FormLabel fontSize="sm" color="gray.400">Từ ngày</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                bg="gray.800"
                border="none"
                color="white"
                _focus={{ bg: "gray.700" }}
              />
            </FormControl>

            <FormControl maxW="250px">
              <FormLabel fontSize="sm" color="gray.400">Đến ngày</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                bg="gray.800"
                border="none"
                color="white"
                _focus={{ bg: "gray.700" }}
              />
            </FormControl>

            {(searchName || filterStatus !== "all" || startDate || endDate) && (
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={() => {
                  setSearchName("")
                  setFilterStatus("all")
                  setStartDate("")
                  setEndDate("")
                }}
                alignSelf="flex-end"
              >
                Xóa bộ lọc
              </Button>
            )}
          </HStack>
        </VStack>

        {/* Statistics */}
        <HStack spacing={4} mb={6}>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Tổng suất chiếu</Text>
            <Text fontSize="2xl" fontWeight="bold" color="orange.400">
              {showtimes.length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Kết quả lọc</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.400">
              {filteredShowtimes.length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Trang hiện tại</Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.400">
              {currentPage}/{totalPages || 1}
            </Text>
          </Box>
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner color="orange.400" size="xl" />
          </Flex>
        ) : error ? (
          <Text color="red.400">{error}</Text>
        ) : filteredShowtimes.length === 0 ? (
          <Text textAlign="center" color="gray.400" fontSize="lg" mt={10}>
            Không tìm thấy suất chiếu nào
          </Text>
        ) : (
          <>
            <Box overflowX="auto" bg="#1a1e29" borderRadius="2xl" p={6} boxShadow="0 0 15px rgba(255,140,0,0.1)">
              <Table variant="simple" colorScheme="whiteAlpha" size="sm">
                <Thead bg="#222633">
                  <Tr>
                    <Th color="orange.400">Poster</Th>
                    <Th color="orange.400">Tên phim</Th>
                    <Th color="orange.400">Phòng chiếu</Th>
                    <Th color="orange.400">Thời gian chiếu</Th>
                    <Th color="orange.400">Người tạo</Th>
                    <Th color="orange.400">Trạng thái</Th>
                    <Th color="orange.400">Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.map((s) => {
                    const { label, color } = getStatus(s)
                    const editable = canEdit(s)

                    return (
                      <Tr key={s._id} _hover={{ bg: "#252a38" }} transition="0.2s">
                        <Td>
                          <Image
                            src={s.movie_id?.poster_url}
                            alt={s.movie_id?.title}
                            boxSize="60px"
                            borderRadius="md"
                            objectFit="cover"
                            fallbackSrc="https://via.placeholder.com/60"
                          />
                        </Td>
                        <Td>
                          <Text fontWeight="bold" fontSize="sm">
                            {s.movie_id?.title || "Không rõ"}
                          </Text>
                        </Td>
                        <Td fontSize="sm">
                          {(() => {
                            const roomName = s.room_id?.name || "Không rõ";
                            const theaterName = s.room_id?.theater_name || "";
                            return theaterName ? `${roomName} - ${theaterName}` : roomName;
                          })()}
                        </Td>
                        <Td fontSize="sm">{formatDateTime(s)}</Td>
                        <Td fontSize="sm">{s.created_by?.name || s.created_by?.email || "Admin"}</Td>
                        <Td>
                          <Badge colorScheme={
                            label === "Đã hủy" ? "red" :
                              label === "Sắp chiếu" ? "blue" :
                                label === "Đang chiếu" ? "green" : "gray"
                          } fontSize="xs">
                            {label}
                          </Badge>
                        </Td>
                        <Td>
                          <Tooltip
                            label={
                              s.status === "inactive"
                                ? editable
                                  ? "Kích hoạt lại suất chiếu"
                                  : "Không thể kích hoạt (dưới 15 phút)"
                                : editable
                                  ? "Hủy suất chiếu"
                                  : "Không thể hủy (dưới 15 phút)"
                            }
                            hasArrow
                          >
                            <IconButton
                              icon={s.status === "inactive" ? <FaCheckCircle /> : <FaBan />}
                              size="sm"
                              colorScheme={
                                !editable
                                  ? "gray"
                                  : s.status === "inactive"
                                    ? "green"
                                    : "red"
                              }
                              onClick={() => toggleShowtimeStatus(s)}
                              isDisabled={!editable}
                              isLoading={canceling}
                              _hover={{ transform: "scale(1.1)" }}
                              transition="0.2s"
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6}>
                <Text color="gray.400" fontSize="sm">
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredShowtimes.length)} / {filteredShowtimes.length}
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    bg="#23242a"
                    color="white"
                    _hover={{ bg: "#2d2e35" }}
                  >
                    Trước
                  </Button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          bg={currentPage === page ? "orange.400" : "#23242a"}
                          color="white"
                          _hover={{
                            bg: currentPage === page ? "orange.500" : "#2d2e35",
                          }}
                        >
                          {page}
                        </Button>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <Text key={page} color="gray.400">...</Text>
                    }
                    return null
                  })}
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    bg="#23242a"
                    color="white"
                    _hover={{ bg: "#2d2e35" }}
                  >
                    Sau
                  </Button>
                </HStack>
              </Flex>
            )}
          </>
        )}
      </Box>

      {/* 🔹 Modal thêm suất chiếu */}
      <Modal isOpen={isAddOpen} onClose={closeAdd} isCentered size="lg">
        <ModalOverlay />
        <ModalContent bg="#1a1e29" color="white">
          <ModalHeader>Thêm suất chiếu mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Phim</FormLabel>
                <Select
                  placeholder="Chọn phim"
                  value={newShowtime.movie_id}
                  onChange={(e) => setNewShowtime({ ...newShowtime, movie_id: e.target.value })}
                  bg="gray.800"
                  borderColor="gray.600"
                  _hover={{ borderColor: "orange.400" }}
                  _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px" }}
                >
                  {movies.length === 0 ? (
                    <option disabled style={{ background: "#1a202c", color: "gray" }}>
                      Đang tải phim...
                    </option>
                  ) : (
                    movies.map((m) => (
                      <option key={m._id} value={m._id} style={{ background: "#1a202c", color: "white" }}>
                        {m.title}
                      </option>
                    ))
                  )}
                </Select>
                {newShowtime.movie_id && (
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    ID đã chọn: {newShowtime.movie_id}
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Phòng chiếu</FormLabel>
                <Select
                  placeholder="Chọn phòng - rạp"
                  value={newShowtime.room_id}
                  onChange={(e) => setNewShowtime({ ...newShowtime, room_id: e.target.value })}
                  bg="gray.800"
                  borderColor="gray.600"
                  _hover={{ borderColor: "orange.400" }}
                  _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px" }}
                >
                  {activeRooms.length === 0 ? (
                    <option disabled style={{ background: "#1a202c", color: "gray" }}>
                      Không có phòng hoạt động
                    </option>
                  ) : (
                    activeRooms.map((r) => {
                      const roomId = r._id || r.id;
                      const roomName = r.name || `Phòng ${roomId}`;
                      const theaterName = r.theater_name || "";
                      const displayText = theaterName ? `${roomName} - ${theaterName}` : roomName;
                      return (
                        <option
                          key={roomId}
                          value={roomId}
                          style={{ background: "#1a202c", color: "white" }}
                        >
                          {displayText}
                        </option>
                      );
                    })
                  )}
                </Select>
                {newShowtime.room_id && (
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    ID đã chọn: {newShowtime.room_id}
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Ngày chiếu</FormLabel>
                <Input
                  type="date"
                  value={newShowtime.date}
                  onChange={(e) => setNewShowtime({ ...newShowtime, date: e.target.value })}
                  bg="gray.800"
                  borderColor="gray.600"
                  _hover={{ borderColor: "orange.400" }}
                  _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px" }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Giờ chiếu (HH:mm)</FormLabel>
                <Input
                  type="time"
                  value={newShowtime.time}
                  onChange={(e) => setNewShowtime({ ...newShowtime, time: e.target.value })}
                  bg="gray.800"
                  borderColor="gray.600"
                  _hover={{ borderColor: "orange.400" }}
                  _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px" }}
                />
              </FormControl>

              <Flex gap={3} w="100%" justify="flex-end" pt={4}>
                <Button onClick={closeAdd} bg="gray.700" _hover={{ bg: "gray.600" }}>
                  Hủy
                </Button>
                <Button
                  colorScheme="orange"
                  isLoading={adding}
                  onClick={addShowtime}
                  loadingText="Đang thêm..."
                  isDisabled={!newShowtime.movie_id || !newShowtime.room_id || !newShowtime.date || !newShowtime.time}
                >
                  Xác nhận thêm
                </Button>
              </Flex>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
