import { useState } from "react";
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
  Flex,
  Badge,
  InputGroup,
  InputRightElement,
  IconButton,
  SimpleGrid,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";

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
);

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  const validateUsername = (username) => {
    const value = username.trim();

    if (!value) return "Tên đăng nhập không được để trống";
    if (value.length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự";
    if (value.length > 30) return "Tên đăng nhập không được quá 30 ký tự";

    return "";
  };

  const validateEmail = (email) => {
    const value = email.trim().toLowerCase();

    if (!value) return "Email không được để trống";
    if (!emailRegex.test(value)) return "Email không đúng định dạng";

    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Mật khẩu không được để trống";
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";

    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return "Vui lòng nhập lại mật khẩu";
    if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp";

    return "";
  };

  const validateForm = () => {
    const newErrors = {
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(
        formData.password,
        formData.confirmPassword
      ),
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some((item) => item);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleBlur = (fieldName) => {
    if (fieldName === "username") {
      setErrors((prev) => ({
        ...prev,
        username: validateUsername(formData.username),
      }));
    }

    if (fieldName === "email") {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(formData.email),
      }));
    }

    if (fieldName === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(formData.password),
        confirmPassword: formData.confirmPassword
          ? validateConfirmPassword(formData.password, formData.confirmPassword)
          : prev.confirmPassword,
      }));
    }

    if (fieldName === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(
          formData.password,
          formData.confirmPassword
        ),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Thông tin chưa hợp lệ",
        description: "Vui lòng kiểm tra lại thông tin đăng ký",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/register-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (
        res.status === 200 ||
        res.status === 201 ||
        (data?.message && data.message.toLowerCase().includes("thành công"))
      ) {
        toast({
          title: "Đăng ký thành công!",
          description:
            data?.message || "Vui lòng kiểm tra email để xác thực tài khoản.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        setTimeout(() => {
          navigate("/login");
        }, 4000);
      } else {
        toast({
          title: "Đăng ký thất bại",
          description: data?.message || "Có lỗi xảy ra!",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setIsLoading(false);
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến server",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" position="relative" overflow="hidden" bg="#060b16">
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

      {/* Overlay */}
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(135deg, rgba(4,8,20,0.95) 0%, rgba(7,10,20,0.86) 40%, rgba(10,8,16,0.92) 100%)"
      />

      {/* Glow */}
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
                    Tạo tài khoản để
                    <br />
                    bắt đầu hành trình
                    <br />
                    điện ảnh
                  </Heading>

                  <Text
                    color="gray.300"
                    fontSize="md"
                    lineHeight="1.9"
                    maxW="500px"
                  >
                    Đăng ký để đặt vé nhanh hơn, lưu phim yêu thích, theo dõi
                    lịch chiếu mới và nhận ưu đãi hấp dẫn từ CineMago.
                  </Text>
                </Box>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FeatureItem
                    icon="🎟️"
                    title="Đặt vé nhanh"
                    desc="Tiết kiệm thời gian chỉ với vài bước"
                  />
                  <FeatureItem
                    icon="🔥"
                    title="Ưu đãi riêng"
                    desc="Nhận khuyến mãi sớm cho thành viên"
                  />
                  <FeatureItem
                    icon="❤️"
                    title="Lưu phim yêu thích"
                    desc="Theo dõi bộ phim bạn quan tâm"
                  />
                  <FeatureItem
                    icon="🔔"
                    title="Nhắc lịch chiếu"
                    desc="Không bỏ lỡ suất chiếu hấp dẫn"
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
                      Bắt đầu trải nghiệm cùng CineMago
                    </Text>
                    <Text color="gray.200" fontSize="sm">
                      Đăng ký một lần, tận hưởng cả thế giới điện ảnh
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
                        JOIN CINEMAGO
                      </Text>
                      <Heading
                        fontSize={{ base: "3xl", md: "4xl" }}
                        color="orange.400"
                        mb={2}
                      >
                        Đăng ký
                      </Heading>
                      <Text color="gray.400" fontSize="sm">
                        Tạo tài khoản mới để trải nghiệm đặt vé phim dễ dàng hơn
                      </Text>
                    </Box>

                    <form onSubmit={handleSubmit}>
                      <VStack spacing={5}>
                        <FormControl isRequired isInvalid={!!errors.username}>
                          <FormLabel color="gray.200" fontWeight="600">
                            Tên đăng nhập
                          </FormLabel>
                          <Input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            onBlur={() => handleBlur("username")}
                            placeholder="Nhập tên đăng nhập"
                            autoComplete="username"
                            h="56px"
                            rounded="16px"
                            color="white"
                            bg="rgba(255,255,255,0.06)"
                            border="1px solid rgba(255,255,255,0.10)"
                            _placeholder={{ color: "gray.500" }}
                            _hover={{ borderColor: "orange.300" }}
                            _focus={{
                              borderColor: "orange.400",
                              boxShadow:
                                "0 0 0 1px #fb923c, 0 0 0 6px rgba(251,146,60,0.12)",
                              bg: "rgba(255,255,255,0.08)",
                            }}
                          />
                          {errors.username && (
                            <Text mt={2} fontSize="sm" color="red.300">
                              {errors.username}
                            </Text>
                          )}
                        </FormControl>

                        <FormControl isRequired isInvalid={!!errors.email}>
                          <FormLabel color="gray.200" fontWeight="600">
                            Email
                          </FormLabel>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => handleBlur("email")}
                            placeholder="Nhập email của bạn"
                            autoComplete="email"
                            h="56px"
                            rounded="16px"
                            color="white"
                            bg="rgba(255,255,255,0.06)"
                            border="1px solid rgba(255,255,255,0.10)"
                            _placeholder={{ color: "gray.500" }}
                            _hover={{ borderColor: "orange.300" }}
                            _focus={{
                              borderColor: "orange.400",
                              boxShadow:
                                "0 0 0 1px #fb923c, 0 0 0 6px rgba(251,146,60,0.12)",
                              bg: "rgba(255,255,255,0.08)",
                            }}
                          />
                          {errors.email && (
                            <Text mt={2} fontSize="sm" color="red.300">
                              {errors.email}
                            </Text>
                          )}
                        </FormControl>

                        <FormControl isRequired isInvalid={!!errors.password}>
                          <FormLabel color="gray.200" fontWeight="600">
                            Mật khẩu
                          </FormLabel>
                          <InputGroup>
                            <Input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              onBlur={() => handleBlur("password")}
                              placeholder="Nhập mật khẩu"
                              autoComplete="new-password"
                              h="56px"
                              rounded="16px"
                              pr="52px"
                              color="white"
                              bg="rgba(255,255,255,0.06)"
                              border="1px solid rgba(255,255,255,0.10)"
                              _placeholder={{ color: "gray.500" }}
                              _hover={{ borderColor: "orange.300" }}
                              _focus={{
                                borderColor: "orange.400",
                                boxShadow:
                                  "0 0 0 1px #fb923c, 0 0 0 6px rgba(251,146,60,0.12)",
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

                          {errors.password && (
                            <Text mt={2} fontSize="sm" color="red.300">
                            {errors.password}
                            </Text>
                          )}
                        </FormControl>

                        <FormControl
                          isRequired
                          isInvalid={!!errors.confirmPassword}
                        >
                          <FormLabel color="gray.200" fontWeight="600">
                            Xác nhận mật khẩu
                          </FormLabel>
                          <InputGroup>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              onBlur={() => handleBlur("confirmPassword")}
                              placeholder="Nhập lại mật khẩu"
                              autoComplete="new-password"
                              h="56px"
                              rounded="16px"
                              pr="52px"
                              color="white"
                              bg="rgba(255,255,255,0.06)"
                              border="1px solid rgba(255,255,255,0.10)"
                              _placeholder={{ color: "gray.500" }}
                              _hover={{ borderColor: "orange.300" }}
                              _focus={{
                                borderColor: "orange.400",
                                boxShadow:
                                  "0 0 0 1px #fb923c, 0 0 0 6px rgba(251,146,60,0.12)",
                                bg: "rgba(255,255,255,0.08)",
                              }}
                            />
                            <InputRightElement h="56px">
                              <IconButton
                                variant="ghost"
                                color="gray.300"
                                aria-label={
                                  showConfirmPassword
                                    ? "Hide confirm password"
                                    : "Show confirm password"
                                }
                                icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                                onClick={() =>
                                  setShowConfirmPassword((prev) => !prev)
                                }
                                _hover={{ bg: "transparent", color: "orange.300" }}
                              />
                            </InputRightElement>
                          </InputGroup>
                          {errors.confirmPassword && (
                            <Text mt={2} fontSize="sm" color="red.300">
                              {errors.confirmPassword}
                            </Text>
                          )}
                        </FormControl>

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
                          loadingText="Đang đăng ký..."
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "0 18px 36px rgba(249,115,22,0.32)",
                          }}
                          _active={{ transform: "translateY(0)" }}
                        >
                          Tạo tài khoản
                        </Button>
                      </VStack>
                    </form>

                    <Divider borderColor="whiteAlpha.200" />

                    <HStack justify="center" spacing={2}>
                      <Text fontSize="sm" color="gray.400">
                        Đã có tài khoản?
                      </Text>
                      <Link
                        as={RouterLink}
                        to="/login"
                        color="orange.300"
                        fontWeight="700"
                        fontSize="sm"
                      >
                        Đăng nhập ngay
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
  );
};

export default Register;