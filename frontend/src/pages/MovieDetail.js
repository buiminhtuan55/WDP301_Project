import {
  Box,
  Container,
  Image,
  Heading,
  Text,
  HStack,
  VStack,
  Button,
  Badge,
  Spinner,
  Card,
  CardBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Textarea,
  Flex,
  Divider,
  Icon,
  FormControl,
  FormLabel,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
} from "@chakra-ui/react"
import { StarIcon, TimeIcon, CalendarIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import apiService from "../services/apiService"

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showtimes, setShowtimes] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [userReview, setUserReview] = useState(null)
  const [showtimeSeatsInfo, setShowtimeSeatsInfo] = useState({})
  const [theatersMap, setTheatersMap] = useState({})
  const toast = useToast()
  const {
    isOpen: isTrailerOpen,
    onOpen: onTrailerOpen,
    onClose: onTrailerClose,
  } = useDisclosure()

  const getEmbedUrl = (url) => {
    if (!url) return ""

    if (url.includes("youtube.com/embed")) {
      return url
    }

    const youtuBeRegex = /youtu\.be\/([^"&?\/\s]{11})/
    const youtuBeMatch = url.match(youtuBeRegex)
    if (youtuBeMatch && youtuBeMatch[1]) {
      return `https://www.youtube.com/embed/${youtuBeMatch[1]}`
    }

    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/
    const match = url.match(youtubeRegex)

    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`
    }

    return url
  }

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    apiService.getById("/api/movies/", id, (data, success) => {
      if (!isMounted) return
      if (success) {
        setMovie(data?.data)
        setError("")
      } else {
        setError(data?.message || "Không thể tải thông tin phim")
      }
      setLoading(false)
    })

    apiService.getPublic("/api/showtimes", { movie_id: id }, (data, success) => {
      if (!isMounted) return
      if (success) {
        const showtimesList = Array.isArray(data?.data) ? data.data : []
        setShowtimes(showtimesList)
        loadShowtimeSeatsInfo(showtimesList)

        const theaterIds = new Set()
        showtimesList.forEach((st) => {
          const theaterId =
            st.room_id?.theater_id?._id ||
            st.room_id?.theater_id ||
            st.room_id?.theater_id?.id
          if (theaterId) {
            theaterIds.add(
              typeof theaterId === "string" ? theaterId : theaterId._id || theaterId.id
            )
          }
        })

        if (theaterIds.size > 0) {
          loadTheatersInfo(Array.from(theaterIds))
        }
      } else {
        setShowtimes([])
      }
    })

    loadReviews(id)

    return () => {
      isMounted = false
    }
  }, [id])

  const loadReviews = (movieId) => {
    setReviewsLoading(true)
    apiService.getPublic(
      `/api/reviews/movie/${movieId}`,
      { page: 1, limit: 20 },
      (data, success) => {
        if (success) {
          setReviews(Array.isArray(data?.data) ? data.data : [])
        } else {
          setReviews([])
        }
        setReviewsLoading(false)
      }
    )
  }

  const loadTheatersInfo = (theaterIds) => {
    apiService.post(
      "/api/public/theaters/list",
      { page: 1, pageSize: 1000, status: "active" },
      (data, success) => {
        if (success && data?.list) {
          const theaters = {}
          data.list.forEach((theater) => {
            const theaterId = theater.id || theater._id
            if (theaterId) {
              theaters[theaterId] = {
                name: theater.name || "Rạp không xác định",
                location: theater.location || "",
              }
            }
          })
          setTheatersMap(theaters)
        }
      }
    )
  }

  const loadShowtimeSeatsInfo = (showtimesList) => {
    const seatsInfoMap = {}
    let completed = 0
    const total = showtimesList.length

    if (total === 0) {
      setShowtimeSeatsInfo({})
      return
    }

    showtimesList.forEach((showtime) => {
      const showtimeId = showtime._id
      const roomId = showtime.room_id?._id || showtime.room_id

      if (!roomId) {
        seatsInfoMap[showtimeId] = { booked: 0, total: 0 }
        completed++
        if (completed === total) {
          setShowtimeSeatsInfo(seatsInfoMap)
        }
        return
      }

      const bookedSeatsPromise = new Promise((resolve) => {
        apiService.getPublic(
          `/api/showtimes/${showtimeId}/booked-seats`,
          {},
          (data, success) => {
            resolve(success ? data?.booked_seats?.length || 0 : 0)
          }
        )
      })

      const roomSeatsPromise = new Promise((resolve) => {
        apiService.getPublic(`/api/public/rooms/${roomId}/seats`, {}, (data, success) => {
          if (success) {
            const totalSeats = data?.list?.length || data?.seats?.length || 0
            resolve(totalSeats)
          } else {
            resolve(0)
          }
        })
      })

      Promise.all([bookedSeatsPromise, roomSeatsPromise])
        .then(([bookedCount, totalSeats]) => {
          seatsInfoMap[showtimeId] = {
            booked: bookedCount,
            total: totalSeats,
          }
          completed++
          if (completed === total) {
            setShowtimeSeatsInfo(seatsInfoMap)
          }
        })
        .catch(() => {
          seatsInfoMap[showtimeId] = { booked: 0, total: 0 }
          completed++
          if (completed === total) {
            setShowtimeSeatsInfo(seatsInfoMap)
          }
        })
    })
  }

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Vui lòng chọn đánh giá",
        description: "Bạn cần chọn số sao để đánh giá phim.",
        status: "warning",
        duration: 3000,
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: "Vui lòng nhập bình luận",
        description: "Bạn cần nhập bình luận để đánh giá phim.",
        status: "warning",
        duration: 3000,
      })
      return
    }

    setSubmitting(true)
    apiService.post(
      "/api/reviews",
      {
        movie_id: id,
        rating,
        comment: comment.trim(),
      },
      (data, success) => {
        setSubmitting(false)
        if (success) {
          toast({
            title: "Thành công",
            description:
              data?.message || "Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!",
            status: "success",
            duration: 3000,
          })
          setRating(0)
          setComment("")
          setUserReview(data?.data || null)
          loadReviews(id)
        } else {
          toast({
            title: "Lỗi",
            description: data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.",
            status: "error",
            duration: 5000,
          })
        }
      }
    )
  }

  if (loading)
    return (
      <Box bg="#050814" minH="100vh" py={16}>
        <Container maxW="1200px">
          <Box textAlign="center" py={24}>
            <Spinner color="orange.400" size="xl" thickness="4px" />
            <Text color="gray.300" mt={4}>
              Đang tải thông tin phim...
            </Text>
          </Box>
        </Container>
      </Box>
    )

  if (error)
    return (
      <Box bg="#050814" minH="100vh" py={16}>
        <Container maxW="1200px">
          <Card
            bg="rgba(12,18,35,0.88)"
            color="white"
            border="1px solid rgba(255,255,255,0.08)"
            rounded="28px"
          >
            <CardBody p={8} textAlign="center">
              <Text color="red.400">{error}</Text>
            </CardBody>
          </Card>
        </Container>
      </Box>
    )

  if (!movie)
    return (
      <Box bg="#050814" minH="100vh" py={16}>
        <Container maxW="1200px">
          <Card
            bg="rgba(12,18,35,0.88)"
            color="white"
            border="1px solid rgba(255,255,255,0.08)"
            rounded="28px"
          >
            <CardBody p={8} textAlign="center">
              <Text color="white">Không tìm thấy phim</Text>
            </CardBody>
          </Card>
        </Container>
      </Box>
    )

  return (
    <Box bg="#050814" minH="100vh" position="relative" overflow="hidden">
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

      <Box position="relative">
        {movie.poster_url && (
          <Box
            position="absolute"
            inset="0"
            h={{ base: "auto", lg: "560px" }}
            backgroundImage={`url(${movie.poster_url})`}
            backgroundSize="cover"
            backgroundPosition="center"
            filter="blur(12px)"
            transform="scale(1.05)"
            opacity={0.28}
          />
        )}

        <Box
          position="absolute"
          inset="0"
          h={{ base: "auto", lg: "560px" }}
          bg="linear-gradient(180deg, rgba(5,8,20,0.72) 0%, rgba(5,8,20,0.92) 60%, #050814 100%)"
        />

        <Container maxW="1200px" position="relative" zIndex={2} py={{ base: 10, md: 16 }}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10} alignItems="center">
            <Flex justify={{ base: "center", lg: "start" }}>
              <Box position="relative">
                <Box
                  position="absolute"
                  inset="-18px"
                  bg="orange.400"
                  opacity={0.14}
                  filter="blur(42px)"
                  rounded="30px"
                />
                <Image
                  src={movie.poster_url}
                  alt={movie.title}
                  w={{ base: "280px", md: "340px" }}
                  h={{ base: "420px", md: "500px" }}
                  objectFit="cover"
                  rounded="30px"
                  border="1px solid rgba(255,255,255,0.10)"
                  boxShadow="0 25px 70px rgba(0,0,0,0.45)"
                  position="relative"
                  zIndex={2}
                />
              </Box>
            </Flex>

            <VStack align="start" spacing={5}>
              <Badge
                px={4}
                py={1.5}
                rounded="full"
                bg="linear-gradient(90deg, #fb923c, #f97316)"
                color="white"
                fontWeight="700"
                fontSize="0.8rem"
              >
                CINEMAGO MOVIE
              </Badge>

              <Heading
                color="white"
                fontSize={{ base: "3xl", md: "5xl" }}
                lineHeight="1.05"
              >
                {movie.title}
              </Heading>

              <HStack wrap="wrap" spacing={3}>
                {(movie.genre || []).slice(0, 5).map((g) => (
                  <Badge
                    key={g}
                    px={3}
                    py={1}
                    rounded="full"
                    bg="whiteAlpha.200"
                    color="white"
                    fontWeight="500"
                  >
                    {g}
                  </Badge>
                ))}
              </HStack>

              <HStack spacing={5} wrap="wrap">
                {movie.duration ? (
                  <HStack spacing={2} color="gray.300">
                    <TimeIcon color="orange.300" />
                    <Text>{movie.duration} phút</Text>
                  </HStack>
                ) : null}

                {movie.release_date ? (
                  <HStack spacing={2} color="gray.300">
                    <CalendarIcon color="orange.300" />
                    <Text>
                      {new Date(movie.release_date).toLocaleDateString("vi-VN")}
                    </Text>
                  </HStack>
                ) : null}
              </HStack>

              <Text color="gray.200" maxW="620px" lineHeight="1.9" fontSize="md">
                {movie.description || movie.overview || ""}
              </Text>

              <HStack spacing={4} pt={2} wrap="wrap">
                {movie.trailer_url && (
                  <Button
                    h="54px"
                    px={8}
                    rounded="full"
                    bg="linear-gradient(90deg, #f59e0b, #f97316)"
                    color="white"
                    fontWeight="700"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 18px 36px rgba(249,115,22,0.30)",
                    }}
                    onClick={onTrailerOpen}
                  >
                    Xem Trailer
                  </Button>
                )}

                <Button
                  h="54px"
                  px={8}
                  rounded="full"
                  bg="whiteAlpha.160"
                  color="white"
                  border="1px solid rgba(255,255,255,0.12)"
                  rightIcon={<ChevronRightIcon />}
                  _hover={{ bg: "whiteAlpha.220" }}
                  onClick={() => {
                    const activeShowtime = showtimes.find((s) => s.status === "active")
                    if (activeShowtime?._id) {
                      navigate(`/bookings/seats/${activeShowtime._id}`)
                    }
                  }}
                  isDisabled={!showtimes.some((s) => s.status === "active")}
                >
                  Đặt vé ngay
                </Button>
              </HStack>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      <Container maxW="1200px" position="relative" zIndex={2} pb={16}>
        <Card
          bg="rgba(12,18,35,0.88)"
          color="white"
          border="1px solid rgba(255,255,255,0.08)"
          rounded="28px"
          boxShadow="0 18px 50px rgba(0,0,0,0.25)"
        >
          <CardBody p={{ base: 5, md: 8 }}>
            <Tabs variant="soft-rounded" colorScheme="orange">
              <TabList gap={3} mb={6} flexWrap="wrap">
                <Tab
                  rounded="full"
                  px={6}
                  py={3}
                  color="gray.300"
                  _selected={{
                    color: "white",
                    bg: "orange.400",
                  }}
                >
                  Showtime
                </Tab>
                <Tab
                  rounded="full"
                  px={6}
                  py={3}
                  color="gray.300"
                  _selected={{
                    color: "white",
                    bg: "orange.400",
                  }}
                >
                  Review
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  {(() => {
                    const activeShowtimes = showtimes.filter((s) => s.status === "active")

                    if (activeShowtimes.length === 0) {
                      return (
                        <Box
                          textAlign="center"
                          py={14}
                          rounded="24px"
                          bg="rgba(255,255,255,0.03)"
                          border="1px solid rgba(255,255,255,0.06)"
                        >
                          <Text color="gray.400">Chưa có suất chiếu cho phim này</Text>
                        </Box>
                      )
                    }

                    const showtimesByDateTheaterAndRoom = activeShowtimes.reduce(
                      (acc, showtime) => {
                        const dateKey = showtime.start_time.vietnamFormatted.split(" ")[1]

                        let theaterId = null
                        if (showtime.room_id?.theater_id) {
                          if (typeof showtime.room_id.theater_id === "string") {
                            theaterId = showtime.room_id.theater_id
                          } else {
                            theaterId =
                              showtime.room_id.theater_id._id ||
                              showtime.room_id.theater_id.id ||
                              showtime.room_id.theater_id
                          }
                        }

                        let theaterName = "Rạp không xác định"
                        if (showtime.room_id?.theater_id?.name) {
                          theaterName = showtime.room_id.theater_id.name
                        } else if (theaterId && theatersMap[theaterId]) {
                          theaterName = theatersMap[theaterId].name
                        }

                        const roomId = showtime.room_id?._id || showtime.room_id
                        const roomName = showtime.room_id?.name || "Phòng không xác định"

                        if (!acc[dateKey]) {
                          acc[dateKey] = {}
                        }

                        if (!acc[dateKey][theaterId]) {
                          acc[dateKey][theaterId] = {
                            theaterName,
                            rooms: {},
                          }
                        }

                        if (!acc[dateKey][theaterId].rooms[roomId]) {
                          acc[dateKey][theaterId].rooms[roomId] = {
                            roomName,
                            showtimes: [],
                          }
                        }

                        acc[dateKey][theaterId].rooms[roomId].showtimes.push(showtime)
                        return acc
                      },
                      {}
                    )

                    const sortedDates = Object.keys(showtimesByDateTheaterAndRoom).sort(
                      (a, b) => {
                        const [dayA, monthA, yearA] = a.split("/")
                        const [dayB, monthB, yearB] = b.split("/")
                        return (
                          new Date(yearA, monthA - 1, dayA) -
                          new Date(yearB, monthB - 1, dayB)
                        )
                      }
                    )

                    return sortedDates.map((date) => (
                      <Box key={date} mb={10}>
                        <Heading size="md" mb={5} color="orange.400">
                          {date}
                        </Heading>

                        {Object.keys(showtimesByDateTheaterAndRoom[date]).map((theaterId) => {
                          const theaterData = showtimesByDateTheaterAndRoom[date][theaterId]
                          return (
                            <Box
                              key={theaterId}
                              mb={6}
                              p={5}
                              rounded="24px"
                              bg="rgba(255,255,255,0.03)"
                              border="1px solid rgba(255,255,255,0.06)"
                            >
                              <Heading size="sm" mb={4} color="orange.300">
                                {theaterData.theaterName}
                              </Heading>

                              {Object.keys(theaterData.rooms).map((roomId) => {
                                const roomData = theaterData.rooms[roomId]
                                return (
                                  <Box key={roomId} mb={5}>
                                    <Text
                                      fontSize="md"
                                      mb={3}
                                      color="gray.300"
                                      fontWeight="600"
                                    >
                                      {roomData.roomName}
                                    </Text>

                                    <HStack wrap="wrap" spacing={4}>
                                      {roomData.showtimes
                                        .sort((a, b) =>
                                          a.start_time.vietnamFormatted.localeCompare(
                                            b.start_time.vietnamFormatted
                                          )
                                        )
                                        .map((showtime) => {
                                          const timeMatch =
                                            showtime.start_time.vietnamFormatted.match(
                                              /^(\d{2}:\d{2})/
                                            )
                                          const time = timeMatch
                                            ? timeMatch[1]
                                            : showtime.start_time.vietnamFormatted.split(" ")[0]

                                          const seatsInfo = showtimeSeatsInfo[showtime._id] || {
                                            booked: 0,
                                            total: 0,
                                          }
                                          const availableSeats =
                                            seatsInfo.total - seatsInfo.booked

                                          return (
                                            <Button
                                              key={showtime._id}
                                              minW="110px"
                                              h="76px"
                                              rounded="22px"
                                              bg="rgba(255,255,255,0.06)"
                                              color="white"
                                              border="1px solid rgba(255,255,255,0.10)"
                                              _hover={{
                                                bg: "orange.400",
                                                borderColor: "orange.400",
                                                color: "white",
                                                transform: "translateY(-2px)",
                                              }}
                                              onClick={() =>
                                                navigate(`/bookings/seats/${showtime._id}`)
                                              }
                                            >
                                              <VStack spacing={1}>
                                                <Text fontSize="md" fontWeight="700">
                                                  {time}
                                                </Text>
                                                {seatsInfo.total > 0 && (
                                                  <Text fontSize="xs" color="gray.200">
                                                    {availableSeats}/{seatsInfo.total} ghế
                                                  </Text>
                                                )}
                                              </VStack>
                                            </Button>
                                          )
                                        })}
                                    </HStack>
                                  </Box>
                                )
                              })}
                            </Box>
                          )
                        })}
                      </Box>
                    ))
                  })()}
                </TabPanel>

                <TabPanel px={0}>
                  <VStack spacing={7} align="stretch">
                    <Box>
                      <Heading size="md" mb={4} color="orange.400">
                        Đánh giá phim
                      </Heading>

                      <Card
                        bg="rgba(255,255,255,0.04)"
                        border="1px solid rgba(255,255,255,0.06)"
                        rounded="24px"
                      >
                        <CardBody p={5}>
                          <VStack spacing={4} align="stretch">
                            <FormControl>
                              <FormLabel color="gray.300">Đánh giá của bạn</FormLabel>
                              <HStack spacing={1}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Icon
                                    key={star}
                                    as={StarIcon}
                                    w={6}
                                    h={6}
                                    color={star <= rating ? "yellow.400" : "gray.500"}
                                    cursor="pointer"
                                    onClick={() => setRating(star)}
                                    _hover={{ color: "yellow.400" }}
                                  />
                                ))}
                                {rating > 0 && (
                                  <Text color="gray.300" ml={2}>
                                    {rating} / 5 sao
                                  </Text>
                                )}
                              </HStack>
                            </FormControl>

                            <FormControl>
                              <FormLabel color="gray.300">Bình luận</FormLabel>
                              <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Chia sẻ suy nghĩ của bạn về bộ phim..."
                                bg="rgba(255,255,255,0.06)"
                                color="white"
                                border="1px solid rgba(255,255,255,0.10)"
                                rounded="20px"
                                _placeholder={{ color: "gray.500" }}
                                _focus={{
                                  borderColor: "orange.400",
                                  boxShadow: "0 0 0 1px #fb923c",
                                }}
                                rows={4}
                              />
                            </FormControl>

                            <Button
                              alignSelf="start"
                              h="50px"
                              px={7}
                              rounded="full"
                              bg="linear-gradient(90deg, #f59e0b, #f97316)"
                              color="white"
                              onClick={handleSubmitReview}
                              isLoading={submitting}
                              isDisabled={rating === 0 || !comment.trim()}
                              _hover={{
                                transform: "translateY(-1px)",
                                boxShadow: "0 14px 28px rgba(249,115,22,0.28)",
                              }}
                            >
                              Gửi đánh giá
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    </Box>

                    <Divider borderColor="whiteAlpha.200" />

                    <Box>
                      <Heading size="md" mb={4} color="orange.400">
                        Đánh giá từ người xem ({reviews.length})
                      </Heading>

                      {reviewsLoading ? (
                        <Box textAlign="center" py={8}>
                          <Spinner color="orange.400" />
                        </Box>
                      ) : reviews.length === 0 ? (
                        <Box
                          textAlign="center"
                          py={10}
                          rounded="24px"
                          bg="rgba(255,255,255,0.03)"
                          border="1px solid rgba(255,255,255,0.06)"
                        >
                          <Text color="gray.400">Chưa có đánh giá nào cho phim này</Text>
                        </Box>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          {reviews.map((review) => (
                            <Card
                              key={review._id}
                              bg="rgba(255,255,255,0.04)"
                              border="1px solid rgba(255,255,255,0.06)"
                              rounded="24px"
                            >
                              <CardBody p={5}>
                                <VStack align="stretch" spacing={2}>
                                  <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                                    <Text fontWeight="700" color="white">
                                      {review.user_id?.full_name ||
                                        review.user_id?.username ||
                                        "Người dùng"}
                                    </Text>

                                    <HStack spacing={1}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Icon
                                          key={star}
                                          as={StarIcon}
                                          w={4}
                                          h={4}
                                          color={
                                            star <= review.rating
                                              ? "yellow.400"
                                              : "gray.500"
                                          }
                                        />
                                      ))}
                                    </HStack>
                                  </Flex>

                                  {review.comment && (
                                    <Text color="gray.300" fontSize="sm" lineHeight="1.8">
                                      {review.comment}
                                    </Text>
                                  )}

                                  <Text color="gray.500" fontSize="xs">
                                    {new Date(review.created_at).toLocaleDateString("vi-VN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </Text>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>

        {movie.trailer_url && (
          <Modal isOpen={isTrailerOpen} onClose={onTrailerClose} size="4xl" isCentered>
            <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
            <ModalContent
              bg="rgba(12,18,35,0.96)"
              color="white"
              maxW="70vw"
              maxH="75vh"
              border="1px solid rgba(255,255,255,0.08)"
              rounded="24px"
            >
              <ModalHeader color="orange.400">Trailer: {movie.title}</ModalHeader>
              <ModalCloseButton color="white" />
              <ModalBody pb={6}>
                <Box
                  position="relative"
                  width="100%"
                  paddingBottom="56.25%"
                  height="0"
                  overflow="hidden"
                  borderRadius="16px"
                >
                  <iframe
                    src={getEmbedUrl(movie.trailer_url)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Trailer của ${movie.title}`}
                  />
                </Box>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </Container>
    </Box>
  )
}