import { useState } from "react"
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Link,
  Divider,
  HStack,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
  Badge,
  SimpleGrid,
} from "@chakra-ui/react"
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import apiService from "../services/apiService"
import authService from "../services/authService"

const FeatureItem = ({ title, desc, icon }) => (
  <Box
    p={4}
    rounded="2xl"
    bg="rgba(255,255,255,0.05)"
    border="1px solid rgba(255,255,255,0.08)"
    backdropFilter="blur(10px)"
  >
    <Text color="orange.300" fontWeight="700" mb={1}>
      {icon} {title}
    </Text>
    <Text color="gray.400" fontSize="sm">
      {desc}
    </Text>
  </Box>
)

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [showForgot, setShowForgot] = useState(false)
  const [fpEmail, setFpEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [fpStep, setFpStep] = useState(1)

  const toast = useToast()
  const navigate = useNavigate()
  const backendUrl =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      apiService.post(
        "/login-customer",
        { username, password },
        (response, success) => {
          setIsLoading(false)

          if (success && response) {
            authService.setAuthData(response.accessToken, response.user)
            const role = (response.user?.role || "customer").toLowerCase()
            let redirectPath = "/"
            if (role === "admin") {
              redirectPath = "/admin/dashboard"
            } else if (role === "lv1") {
              redirectPath = "/staff/l1"
            }
            toast({
              title: "Đăng nhập thành công!",
              description: `Chào mừng ${response.user.username}`,
              status: "success",
              duration: 3000,
              isClosable: true,
            })
            navigate(redirectPath, { replace: true })
            setTimeout(() => window.location.reload(), 0)
          } else {
            if (response?.needVerification) {
              toast({
                title: "Tài khoản chưa xác thực",
                description: response?.message || "Vui lòng kiểm tra email để xác thực tài khoản.",
                status: "warning",
                duration: 8000,
                isClosable: true,
              })
              // Tự động gửi lại email xác thực
              if (response?.email) {
                fetch(`${backendUrl}/resend-verification`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: response.email }),
                }).then(res => res.json()).then(data => {
                  if (data?.message) {
                    toast({
                      title: data.message,
                      status: "info",
                      duration: 5000,
                      isClosable: true,
                    })
                  }
                }).catch(() => {})
              }
            } else {
              toast({
                title: "Lỗi đăng nhập",
                description: response?.message || "Đăng nhập thất bại",
                status: "error",
                duration: 5000,
                isClosable: true,
              })
            }
          }
        }
      )
    } catch (error) {
      setIsLoading(false)
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến server",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box
      minH="100vh"
      position="relative"
      overflow="hidden"
      bg="#060b16"
    >
      {/* Background image */}
      <Box
        position="absolute"
        inset="0"
        bgImage="url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80')"
        bgSize="cover"
        bgPosition="center"
        transform="scale(1.05)"
        filter="blur(4px)"
      />

      {/* Dark overlay */}
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(135deg, rgba(4,8,20,0.95) 0%, rgba(7,10,20,0.86) 40%, rgba(10,8,16,0.92) 100%)"
      />

      {/* Orange cinematic glow */}
      <Box
        position="absolute"
        top="-120px"
        right="-120px"
        w="420px"
        h="420px"
        bg="orange.400"
        opacity={0.14}
        borderRadius="full"
        filter="blur(140px)"
      />
      <Box
        position="absolute"
        bottom="-140px"
        left="-100px"
        w="380px"
        h="380px"
        bg="red.400"
        opacity={0.12}
        borderRadius="full"
        filter="blur(140px)"
      />
      <Box
        position="absolute"
        top="35%"
        left="45%"
        w="240px"
        h="240px"
        bg="yellow.300"
        opacity={0.06}
        borderRadius="full"
        filter="blur(120px)"
      />

      <Container maxW="1200px" position="relative" zIndex={2} py={{ base: 8, md: 12 }}>
        <Flex minH="100vh" align="center" justify="center">
          <Flex
            w="full"
            maxW="1100px"
            rounded="32px"
            overflow="hidden"
            border="1px solid rgba(255,255,255,0.08)"
            bg="rgba(8, 15, 30, 0.72)"
            backdropFilter="blur(22px)"
            boxShadow="0 30px 100px rgba(0,0,0,0.55)"
            direction={{ base: "column", lg: "row" }}
          >
            {/* LEFT */}
            <Box
              flex="1.05"
              p={{ base: 8, md: 10 }}
              bg="linear-gradient(180deg, rgba(255,145,77,0.10), rgba(255,255,255,0.02))"
              position="relative"
              display={{ base: "none", lg: "block" }}
            >
              <VStack align="start" spacing={7} h="full" justify="space-between">
                <Box>
                  <Badge
                    px={4}
                    py={1.5}
                    borderRadius="full"
                    bg="linear-gradient(90deg, #fb923c, #f97316)"
                    color="white"
                    fontSize="0.82rem"
                    fontWeight="700"
                    mb={6}
                  >
                    CINEMAGO
                  </Badge>

                  <Heading
                    color="white"
                    fontSize={{ base: "4xl", md: "5xl" }}
                    lineHeight="1.1"
                    maxW="470px"
                    mb={5}
                  >
                    Chào mừng bạn
                    <br />
                    trở lại với thế giới
                    <br />
                    điện ảnh
                  </Heading>

                  <Text
                    color="gray.300"
                    fontSize="md"
                    lineHeight="1.9"
                    maxW="500px"
                  >
                    Đăng nhập để đặt vé nhanh hơn, theo dõi lịch chiếu,
                    lưu rạp yêu thích và nhận các ưu đãi hấp dẫn mới nhất
                    từ CineMago.
                  </Text>
                </Box>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FeatureItem
                    icon="🎬"
                    title="Suất chiếu mới"
                    desc="Lịch chiếu cập nhật liên tục mỗi ngày"
                  />
                  <FeatureItem
                    icon="🍿"
                    title="Đặt vé dễ dàng"
                    desc="Chọn ghế và thanh toán nhanh chóng"
                  />
                  <FeatureItem
                    icon="⭐"
                    title="Rạp yêu thích"
                    desc="Lưu cụm rạp bạn thường xem"
                  />
                  <FeatureItem
                    icon="🎁"
                    title="Ưu đãi thành viên"
                    desc="Nhận khuyến mãi và quà tặng hấp dẫn"
                  />
                </SimpleGrid>

                <Box
                  w="full"
                  h="250px"
                  rounded="28px"
                  overflow="hidden"
                  border="1px solid rgba(255,255,255,0.08)"
                  bgImage="url('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80')"
                  bgSize="cover"
                  bgPosition="center"
                  position="relative"
                >
                  <Box
                    position="absolute"
                    inset="0"
                    bg="linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.10))"
                  />
                  <Box position="absolute" left={5} bottom={5}>
                    <Text color="white" fontWeight="700" fontSize="lg">
                      Trải nghiệm điện ảnh sống động
                    </Text>
                    <Text color="gray.200" fontSize="sm">
                      Không gian giải trí hiện đại dành cho bạn
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </Box>

            {/* RIGHT */}
            <Box flex="0.95" p={{ base: 7, md: 10 }}>
              <Card bg="transparent" boxShadow="none">
                <CardBody p={0}>
                  <VStack spacing={6} align="stretch">
                    <Box textAlign="center">
                      <Text
                        color="orange.300"
                        fontWeight="700"
                        letterSpacing="0.18em"
                        fontSize="sm"
                        mb={2}
                      >
                        WELCOME BACK
                      </Text>
                      <Heading
                        fontSize={{ base: "3xl", md: "4xl" }}
                        color="orange.400"
                        mb={2}
                      >
                        Đăng nhập
                      </Heading>
                      <Text color="gray.400" fontSize="sm">
                        Truy cập tài khoản để tiếp tục đặt vé và quản lý lịch xem phim
                      </Text>
                    </Box>

                    <form onSubmit={handleSubmit}>
                      <VStack spacing={5}>
                        <FormControl isRequired>
                          <FormLabel color="gray.200" fontWeight="600">
                            Tên đăng nhập
                          </FormLabel>
                          <Input
                            h="56px"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập tên đăng nhập"
                            autoComplete="username"
                            color="white"
                            bg="rgba(255,255,255,0.06)"
                            border="1px solid rgba(255,255,255,0.10)"
                            rounded="16px"
                            _placeholder={{ color: "gray.500" }}
                            _hover={{ borderColor: "orange.300" }}
                            _focus={{
                              borderColor: "orange.400",
                              boxShadow: "0 0 0 1px #fb923c, 0 0 0 6px rgba(251,146,60,0.12)",
                              bg: "rgba(255,255,255,0.08)",
                            }}
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel color="gray.200" fontWeight="600">
                            Mật khẩu
                          </FormLabel>
                          <InputGroup>
                            <Input
                              h="56px"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Nhập mật khẩu"
                              autoComplete="current-password"
                              color="white"
                              bg="rgba(255,255,255,0.06)"
                              border="1px solid rgba(255,255,255,0.10)"
                              rounded="16px"
                              pr="52px"
                              _placeholder={{ color: "gray.500" }}
                              _hover={{ borderColor: "orange.300" }}
                              _focus={{
                                borderColor: "orange.400",
                                boxShadow: "0 0 0 1px #fb923c, 0 0 0 6px rgba(251,146,60,0.12)",
                                bg: "rgba(255,255,255,0.08)",
                              }}
                            />
                            <InputRightElement h="56px">
                              <IconButton
                                variant="ghost"
                                color="gray.300"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                onClick={() => setShowPassword((prev) => !prev)}
                                _hover={{ bg: "transparent", color: "orange.300" }}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <HStack w="full" justify="space-between" align="center">
                          <Text fontSize="sm" color="gray.500">
                            Truy cập nhanh vào tài khoản của bạn
                          </Text>
                          {!showForgot && (
                            <Link
                              color="orange.300"
                              fontSize="sm"
                              fontWeight="600"
                              onClick={() => {
                                setShowForgot(true)
                                setFpStep(1)
                              }}
                            >
                              Quên mật khẩu?
                            </Link>
                          )}
                        </HStack>

                        <Button
                          type="submit"
                          w="full"
                          h="58px"
                          rounded="16px"
                          bg="linear-gradient(90deg, #f59e0b, #f97316)"
                          color="white"
                          fontSize="md"
                          fontWeight="700"
                          isLoading={isLoading}
                          loadingText="Đang đăng nhập..."
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "0 18px 36px rgba(249,115,22,0.32)",
                          }}
                          _active={{ transform: "translateY(0)" }}
                        >
                          Đăng nhập ngay
                        </Button>

                        <HStack w="full">
                          <Divider borderColor="whiteAlpha.200" />
                          <Text color="gray.400" fontSize="sm" whiteSpace="nowrap">
                            hoặc tiếp tục với
                          </Text>
                          <Divider borderColor="whiteAlpha.200" />
                        </HStack>

                        <Button
                          as="a"
                          href={`${backendUrl}/auth/google`}
                          w="full"
                          h="56px"
                          rounded="16px"
                          bg="rgba(255,255,255,0.08)"
                          color="white"
                          border="1px solid rgba(255,255,255,0.10)"
                          _hover={{
                            bg: "rgba(255,255,255,0.12)",
                            borderColor: "rgba(255,255,255,0.18)",
                          }}
                          leftIcon={
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                              <path d="M17.64,9.2c0-0.63-0.06-1.25-0.16-1.84H9.18v3.48h4.79c-0.2,1.12-0.84,2.07-1.84,2.72v2.26h2.91C16.8,14.7,17.64,12.14,17.64,9.2z"></path>
                              <path d="M9.18,18c2.43,0,4.47-0.8,5.96-2.18l-2.91-2.26c-0.8,0.54-1.84,0.86-2.96,0.86c-2.28,0-4.21-1.54-4.9-3.61H1.28v2.33C2.74,16.1,5.7,18,9.18,18z"></path>
                              <path d="M4.28,10.89c-0.11-0.33-0.17-0.68-0.17-1.04s0.06-0.71,0.17-1.04V6.48H1.28C0.47,8.04,0,9.85,0,11.82s0.47,3.78,1.28,5.34L4.28,10.89z"></path>
                              <path d="M9.18,3.36c1.32,0,2.52,0.45,3.46,1.35l2.59-2.59C13.65,0.8,11.61,0,9.18,0C5.7,0,2.74,1.9,1.28,4.66l3,2.33C4.97,4.9,6.9,3.36,9.18,3.36z"></path>
                            </svg>
                          }
                        >
                          Đăng nhập với Google
                        </Button>
                      </VStack>
                    </form>

                    {showForgot && (
                      <Box
                        mt={1}
                        p={5}
                        rounded="22px"
                        bg="rgba(255,255,255,0.04)"
                        border="1px solid rgba(255,255,255,0.08)"
                      >
                        {fpStep === 1 && (
                          <VStack spacing={4} align="stretch">
                            <Text color="gray.300" fontSize="sm">
                              Nhập email để nhận mã OTP đặt lại mật khẩu
                            </Text>

                            <Input
                              h="52px"
                              value={fpEmail}
                              onChange={(e) => setFpEmail(e.target.value)}
                              placeholder="Nhập email"
                              color="white"
                              bg="rgba(255,255,255,0.06)"
                              border="1px solid rgba(255,255,255,0.10)"
                              rounded="14px"
                              _placeholder={{ color: "gray.500" }}
                            />

                            <HStack>
                              <Button
                                colorScheme="orange"
                                rounded="14px"
                                onClick={() => {
                                  if (!fpEmail) {
                                    return toast({
                                      title: "Nhập email",
                                      status: "warning",
                                    })
                                  }

                                  setIsLoading(true)
                                  apiService.post(
                                    "/forgot-password",
                                    { email: fpEmail },
                                    (res, success) => {
                                      setIsLoading(false)
                                      if (success) {
                                        toast({
                                          title: res?.message || "Yêu cầu OTP thành công",
                                          status: "success",
                                        })
                                        setFpStep(2)
                                      } else {
                                        toast({
                                          title: res?.message || "Lỗi",
                                          status: "error",
                                        })
                                      }
                                    }
                                  )
                                }}
                              >
                                Gửi OTP
                              </Button>

                              <Button
                                variant="ghost"
                                color="gray.300"
                                onClick={() => {
                                  setShowForgot(false)
                                  setFpEmail("")
                                  setOtp("")
                                  setNewPassword("")
                                  setFpStep(1)
                                }}
                              >
                                Hủy
                              </Button>
                            </HStack>
                          </VStack>
                        )}

                        {fpStep === 2 && (
                          <VStack spacing={4} align="stretch">
                            <Text color="gray.300" fontSize="sm">
                              Nhập mã OTP và mật khẩu mới
                            </Text>

                            <Input
                              h="52px"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="Nhập OTP"
                              color="white"
                              bg="rgba(255,255,255,0.06)"
                              border="1px solid rgba(255,255,255,0.10)"
                              rounded="14px"
                              _placeholder={{ color: "gray.500" }}
                            />

                            <InputGroup>
                              <Input
                                h="52px"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                                type={showNewPassword ? "text" : "password"}
                                color="white"
                                bg="rgba(255,255,255,0.06)"
                                border="1px solid rgba(255,255,255,0.10)"
                                rounded="14px"
                                _placeholder={{ color: "gray.500" }}
                              />
                              <InputRightElement h="52px">
                                <IconButton
                                  variant="ghost"
                                  color="gray.300"
                                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                                  icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                                  onClick={() => setShowNewPassword((prev) => !prev)}
                                />
                              </InputRightElement>
                            </InputGroup>

                            <HStack>
                              <Button
                                colorScheme="orange"
                                rounded="14px"
                                onClick={() => {
                                  if (!fpEmail || !otp || !newPassword) {
                                    return toast({
                                      title: "Nhập đầy đủ thông tin",
                                      status: "warning",
                                    })
                                  }

                                  setIsLoading(true)
                                  apiService.post(
                                    "/reset-password",
                                    { email: fpEmail, otp, newPassword },
                                    (res, success) => {
                                      setIsLoading(false)
                                      if (success) {
                                        toast({
                                          title: res?.message || "Đổi mật khẩu thành công",
                                          status: "success",
                                        })
                                        setShowForgot(false)
                                        setFpEmail("")
                                        setOtp("")
                                        setNewPassword("")
                                        setFpStep(1)
                                      } else {
                                        toast({
                                          title: res?.message || "Lỗi",
                                          status: "error",
                                        })
                                      }
                                    }
                                  )
                                }}
                              >
                                Đổi mật khẩu
                              </Button>

                              <Button
                                variant="ghost"
                                color="gray.300"
                                onClick={() => {
                                  setShowForgot(false)
                                  setFpEmail("")
                                  setOtp("")
                                  setNewPassword("")
                                  setFpStep(1)
                                }}
                              >
                                Hủy
                              </Button>
                            </HStack>
                          </VStack>
                        )}
                      </Box>
                    )}

                    <Divider borderColor="whiteAlpha.200" />

                    <HStack justify="center" spacing={2}>
                      <Text fontSize="sm" color="gray.400">
                        Chưa có tài khoản?
                      </Text>
                      <Link
                        as={RouterLink}
                        to="/register"
                        color="orange.300"
                        fontWeight="700"
                        fontSize="sm"
                      >
                        Đăng ký ngay
                      </Link>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

export default Login
