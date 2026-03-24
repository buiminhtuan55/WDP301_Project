import { useEffect, useMemo, useState } from "react"
import {
  Container,
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  Spinner,
  Avatar,
  useToast,
  Grid,
  GridItem,
  Badge,
  Divider,
  Icon,
  InputGroup,
  InputLeftElement,
  FormErrorMessage,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react"
import { EmailIcon, PhoneIcon, CalendarIcon, EditIcon, LockIcon } from "@chakra-ui/icons"
import { format, parseISO, isValid } from "date-fns"
import { useNavigate } from "react-router-dom"
import { FiUser, FiMail, FiPhone, FiCalendar, FiClock, FiUpload } from "react-icons/fi"
import apiService from "../services/apiService"
import authService from "../services/authService"

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [phoneError, setPhoneError] = useState("")
  const [dobError, setDobError] = useState("")
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState("")
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const localUser = authService.getUser()
    const userId = localUser?.id || localUser?._id || localUser?.userId

    if (!userId) {
      apiService.get("/auth/profile-detail", {}, (data, success) => {
        if (!isMounted) return
        setLoading(false)

        if (success) {
          const userData = data?.data || null
          setProfile(userData)
          setForm(normalizeFormData(userData || {}))
        } else {
          setProfile(localUser)
          setForm(normalizeFormData(localUser || {}))
        }
      })

      return () => {
        isMounted = false
      }
    }

    apiService.getById("/users/", userId, (data, success) => {
      if (!isMounted) return
      setLoading(false)

      if (success) {
        const userData = data?.data || data
        setProfile(userData)
        setForm(normalizeFormData(userData || {}))
      } else {
        apiService.get("/auth/profile-detail", {}, (fallbackData, fallbackSuccess) => {
          if (!isMounted) return

          if (fallbackSuccess) {
            const userData = fallbackData?.data || null
            setProfile(userData)
            setForm(normalizeFormData(userData || {}))
          } else {
            setProfile(localUser)
            setForm(normalizeFormData(localUser || {}))
          }
        })
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0]
  }, [])

  function normalizeFormData(data) {
    return {
      ...data,
      fullName: data?.fullName || data?.full_name || "",
      phone: data?.phone || data?.phone_number || "",
      dateOfBirth: formatDateForInput(data?.dateOfBirth),
    }
  }

  function formatDateForInput(dateValue) {
    if (!dateValue) return ""
    try {
      if (typeof dateValue === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue
        const parsed = parseISO(dateValue)
        return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : ""
      }

      const parsed = new Date(dateValue)
      return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : ""
    } catch {
      return ""
    }
  }

  const formatDateDisplay = (dateValue) => {
    if (!dateValue) return "-"
    try {
      const parsed =
        typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue)
      return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "-"
    } catch {
      return "-"
    }
  }

  const formatDateTimeDisplay = (dateValue) => {
    if (!dateValue) return "-"
    try {
      const parsed = new Date(dateValue)
      return isValid(parsed) ? parsed.toLocaleString("vi-VN") : "-"
    } catch {
      return "-"
    }
  }

  const validatePhone = (phone) => {
    if (!phone || phone.trim() === "") return ""
    const vnPhoneRegex = /^(0(3|5|7|8|9))[0-9]{8}$/
    if (!vnPhoneRegex.test(phone.trim())) {
      return "Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam, ví dụ: 0912345678."
    }
    return ""
  }

  const validateDateOfBirth = (dateValue) => {
    if (!dateValue) return ""

    const selectedDate = new Date(dateValue)
    const now = new Date()
    const minDate = new Date("1900-01-01")

    if (!isValid(selectedDate)) {
      return "Ngày sinh không hợp lệ."
    }

    const selected = new Date(selectedDate.toISOString().split("T")[0])
    const current = new Date(now.toISOString().split("T")[0])

    if (selected > current) {
      return "Ngày sinh không được lớn hơn ngày hiện tại."
    }

    if (selected < minDate) {
      return "Ngày sinh không hợp lệ."
    }

    return ""
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setForm((prev) => ({ ...prev, phone: value }))
    setPhoneError(validatePhone(value))
  }

  const handleDobChange = (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, dateOfBirth: value }))
    setDobError(validateDateOfBirth(value))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Vui lòng chọn file ảnh.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      })
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      })
      return
    }

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview)
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const refreshProfile = () => {
    const localUser = authService.getUser()
    const userId = localUser?.id || localUser?._id || localUser?.userId

    if (!userId) return

    apiService.getById("/users/", userId, (data, success) => {
      if (success) {
        const userData = data?.data || data
        setProfile(userData)
        setForm(normalizeFormData(userData || {}))
        setAvatarFile(null)
        setAvatarPreview("")
      }
    })
  }

  const handleUpdate = () => {
    const phoneErr = validatePhone(form.phone)
    const dobErr = validateDateOfBirth(form.dateOfBirth)

    setPhoneError(phoneErr)
    setDobError(dobErr)

    if (phoneErr || dobErr) {
      toast({
        title: "Vui lòng kiểm tra lại thông tin.",
        description: phoneErr || dobErr,
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const formData = new FormData()
    formData.append("fullName", form.fullName || "")
    formData.append("phone", form.phone || "")
    formData.append("dateOfBirth", form.dateOfBirth || "")

    if (avatarFile) {
      formData.append("avatar", avatarFile)
    }

    apiService.putFormData("/update-profile", formData, (res, success) => {
      if (success) {
        toast({
          title: res?.message || "Cập nhật thành công",
          status: "success",
          duration: 2500,
          isClosable: true,
        })
        refreshProfile()
        setEditing(false)
      } else {
        toast({
          title: res?.message || "Có lỗi xảy ra",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
      }
    })
  }

  const handleCancel = () => {
    setEditing(false)
    setPhoneError("")
    setDobError("")
    setAvatarFile(null)
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview("")
    setForm(normalizeFormData(profile || {}))
  }

  const currentAvatar =
    avatarPreview ||
    profile?.avatar ||
    profile?.avatarUrl ||
    profile?.image ||
    profile?.profileImage ||
    ""

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="linear-gradient(180deg, #070b14 0%, #0f172a 55%, #111827 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="orange.400" />
          <Text color="gray.300">Đang tải thông tin tài khoản...</Text>
        </VStack>
      </Box>
    )
  }

  if (!profile) {
    return (
      <Box
        minH="100vh"
        bg="linear-gradient(180deg, #070b14 0%, #0f172a 55%, #111827 100%)"
        py={12}
      >
        <Container maxW="container.lg">
          <Box
            bg="whiteAlpha.100"
            border="1px solid"
            borderColor="whiteAlpha.200"
            borderRadius="2xl"
            p={8}
            textAlign="center"
            backdropFilter="blur(12px)"
          >
            <Text color="white">Không tìm thấy thông tin người dùng.</Text>
          </Box>
        </Container>
      </Box>
    )
  }

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #070b14 0%, #0f172a 55%, #111827 100%)"
      position="relative"
      overflow="hidden"
      py={{ base: 6, md: 10 }}
    >
      <Box
        position="absolute"
        top="-120px"
        left="-120px"
        w="320px"
        h="320px"
        bg="orange.500"
        opacity={0.12}
        filter="blur(120px)"
        borderRadius="full"
      />
      <Box
        position="absolute"
        bottom="-140px"
        right="-120px"
        w="360px"
        h="360px"
        bg="red.500"
        opacity={0.1}
        filter="blur(140px)"
        borderRadius="full"
      />

      <Container maxW="container.xl" position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          <Box
            borderRadius="3xl"
            overflow="hidden"
            bgGradient="linear(to-r, rgba(217,119,6,0.20), rgba(239,68,68,0.10), rgba(15,23,42,0.85))"
            border="1px solid"
            borderColor="whiteAlpha.200"
            boxShadow="0 20px 60px rgba(0,0,0,0.35)"
            backdropFilter="blur(14px)"
          >
            <Grid templateColumns={{ base: "1fr", lg: "320px 1fr" }}>
              <GridItem
                p={{ base: 6, md: 8 }}
                borderRight={{ base: "none", lg: "1px solid" }}
                borderColor="whiteAlpha.200"
              >
                <VStack spacing={5} align={{ base: "center", lg: "start" }}>
                  <Box position="relative">
                    <Avatar
                      size="2xl"
                      name={profile.fullName || profile.username}
                      src={currentAvatar}
                      border="4px solid"
                      borderColor="orange.400"
                      boxShadow="0 0 0 8px rgba(255,255,255,0.05)"
                    />
                    <Badge
                      position="absolute"
                      bottom="2"
                      right="-2"
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg="orange.400"
                      color="black"
                      fontWeight="bold"
                    >
                      MEMBER
                    </Badge>
                  </Box>

                  {editing && (
                    <Box w="full">
                      <FormLabel
                        htmlFor="avatar-upload"
                        mb={2}
                        display="inline-flex"
                        alignItems="center"
                        gap={2}
                        px={4}
                        py={3}
                        borderRadius="xl"
                        bg="whiteAlpha.100"
                        border="1px dashed"
                        borderColor="orange.300"
                        color="orange.200"
                        cursor="pointer"
                        _hover={{ bg: "whiteAlpha.200" }}
                      >
                        <Icon as={FiUpload} />
                        Chọn ảnh avatar
                      </FormLabel>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        display="none"
                        onChange={handleAvatarChange}
                      />
                      <Text color="gray.400" fontSize="sm">
                        Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.
                      </Text>
                    </Box>
                  )}

                  <VStack spacing={1} align={{ base: "center", lg: "start" }}>
                    <Heading size="lg" color="white" textAlign={{ base: "center", lg: "left" }}>
                      {profile.fullName || profile.username || "Người dùng"}
                    </Heading>
                    <Text color="gray.300" fontSize="sm">
                      Tài khoản cá nhân
                    </Text>
                    <Text color="orange.300" fontSize="sm" fontWeight="medium">
                      Trải nghiệm điện ảnh đẳng cấp
                    </Text>
                  </VStack>

                  <VStack
                    w="full"
                    spacing={3}
                    align="stretch"
                    bg="blackAlpha.300"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    p={4}
                    borderRadius="2xl"
                  >
                    <HStack align="start">
                      <Icon as={FiMail} color="orange.300" mt="1" />
                      <VStack spacing={0} align="start">
                        <Text color="gray.400" fontSize="xs">Email</Text>
                        <Text color="white" fontSize="sm" wordBreak="break-word">
                          {profile.email || "-"}
                        </Text>
                      </VStack>
                    </HStack>

                    <HStack align="start">
                      <Icon as={FiPhone} color="orange.300" mt="1" />
                      <VStack spacing={0} align="start">
                        <Text color="gray.400" fontSize="xs">Số điện thoại</Text>
                        <Text color="white" fontSize="sm">
                          {profile.phone || profile.phone_number || "-"}
                        </Text>
                      </VStack>
                    </HStack>

                    <HStack align="start">
                      <Icon as={FiCalendar} color="orange.300" mt="1" />
                      <VStack spacing={0} align="start">
                        <Text color="gray.400" fontSize="xs">Ngày sinh</Text>
                        <Text color="white" fontSize="sm">
                          {formatDateDisplay(profile.dateOfBirth)}
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </VStack>
              </GridItem>

              <GridItem p={{ base: 6, md: 8 }}>
                <VStack spacing={6} align="stretch">
                  <Flex
                    justify="space-between"
                    align={{ base: "start", md: "center" }}
                    direction={{ base: "column", md: "row" }}
                    gap={4}
                  >
                    <Box>
                      <Heading size="md" color="white">
                        Thông tin cá nhân
                      </Heading>
                      <Text color="gray.400" mt={1}>
                        Quản lý hồ sơ tài khoản theo phong cách web rạp chiếu phim chuyên nghiệp.
                      </Text>
                    </Box>

                    {!editing && (
                      <HStack spacing={3}>
                        <Button
                          leftIcon={<EditIcon />}
                          bg="orange.400"
                          color="black"
                          _hover={{ bg: "orange.300" }}
                          borderRadius="xl"
                          px={6}
                          onClick={() => setEditing(true)}
                        >
                          Chỉnh sửa
                        </Button>
                        <Button
                          leftIcon={<LockIcon />}
                          variant="outline"
                          color="orange.300"
                          borderColor="orange.300"
                          _hover={{ bg: "whiteAlpha.100" }}
                          borderRadius="xl"
                          px={6}
                          onClick={() => navigate("/change-password")}
                        >
                          Đổi mật khẩu
                        </Button>
                      </HStack>
                    )}
                  </Flex>

                  <Divider borderColor="whiteAlpha.200" />

                  {!editing ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <InfoCard icon={FiUser} label="Username" value={profile.username || "-"} />
                      <InfoCard icon={FiMail} label="Email" value={profile.email || "-"} />
                      <InfoCard
                        icon={FiUser}
                        label="Họ và tên"
                        value={profile.fullName || profile.full_name || "-"}
                      />
                      <InfoCard
                        icon={FiPhone}
                        label="Số điện thoại"
                        value={profile.phone || profile.phone_number || "-"}
                      />
                      <InfoCard
                        icon={FiCalendar}
                        label="Ngày sinh"
                        value={formatDateDisplay(profile.dateOfBirth)}
                      />
                      <InfoCard
                        icon={FiClock}
                        label="Ngày tạo tài khoản"
                        value={formatDateTimeDisplay(profile.createdAt || profile.created_at)}
                      />
                    </SimpleGrid>
                  ) : (
                    <Box
                      bg="whiteAlpha.50"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      borderRadius="2xl"
                      p={{ base: 4, md: 6 }}
                    >
                      <VStack spacing={5} align="stretch">
                        <FormControl>
                          <FormLabel color="gray.200">Họ và tên</FormLabel>
                          <Input
                            value={form.fullName || ""}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, fullName: e.target.value }))
                            }
                            bg="rgba(15, 23, 42, 0.85)"
                            color="white"
                            borderColor="whiteAlpha.300"
                            _hover={{ borderColor: "orange.300" }}
                            _focus={{
                              borderColor: "orange.400",
                              boxShadow: "0 0 0 1px #f6ad55",
                            }}
                            borderRadius="xl"
                            h="48px"
                            placeholder="Nhập họ và tên"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel color="gray.200">Email</FormLabel>
                          <InputGroup>
                            <InputLeftElement pointerEvents="none" h="48px">
                              <EmailIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                              value={profile.email || ""}
                              isReadOnly
                              bg="rgba(255,255,255,0.06)"
                              color="gray.300"
                              borderColor="whiteAlpha.200"
                              borderRadius="xl"
                              h="48px"
                            />
                          </InputGroup>
                        </FormControl>

                        <FormControl isInvalid={!!phoneError}>
                          <FormLabel color="gray.200">Số điện thoại</FormLabel>
                          <InputGroup>
                            <InputLeftElement pointerEvents="none" h="48px">
                              <PhoneIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                              value={form.phone || ""}
                              onChange={handlePhoneChange}
                              placeholder="VD: 0912345678"
                              maxLength={10}
                              bg="rgba(15, 23, 42, 0.85)"
                              color="white"
                              borderColor="whiteAlpha.300"
                              _hover={{ borderColor: "orange.300" }}
                              _focus={{
                                borderColor: "orange.400",
                                boxShadow: "0 0 0 1px #f6ad55",
                              }}
                              borderRadius="xl"
                              h="48px"
                            />
                          </InputGroup>
                          <FormErrorMessage>{phoneError}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!dobError}>
                          <FormLabel color="gray.200">Ngày tháng năm sinh</FormLabel>
                          <InputGroup>
                            <InputLeftElement pointerEvents="none" h="48px">
                              <CalendarIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                              type="date"
                              value={form.dateOfBirth || ""}
                              onChange={handleDobChange}
                              max={today}
                              bg="rgba(15, 23, 42, 0.85)"
                              color="white"
                              borderColor="whiteAlpha.300"
                              _hover={{ borderColor: "orange.300" }}
                              _focus={{
                                borderColor: "orange.400",
                                boxShadow: "0 0 0 1px #f6ad55",
                              }}
                              borderRadius="xl"
                              h="48px"
                              sx={{
                                "::-webkit-calendar-picker-indicator": {
                                  filter: "invert(1)",
                                  cursor: "pointer",
                                },
                              }}
                            />
                          </InputGroup>
                          <FormErrorMessage>{dobError}</FormErrorMessage>
                        </FormControl>

                        <HStack pt={2} spacing={4}>
                          <Button
                            bg="orange.400"
                            color="black"
                            _hover={{ bg: "orange.300" }}
                            borderRadius="xl"
                            px={8}
                            onClick={handleUpdate}
                          >
                            Lưu thay đổi
                          </Button>
                          <Button
                            variant="ghost"
                            color="gray.300"
                            _hover={{ bg: "whiteAlpha.100" }}
                            borderRadius="xl"
                            px={8}
                            onClick={handleCancel}
                          >
                            Hủy
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </GridItem>
            </Grid>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

function InfoCard({ icon, label, value }) {
  return (
    <Box
      bg="whiteAlpha.50"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
      p={5}
      _hover={{
        transform: "translateY(-2px)",
        borderColor: "orange.300",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
      }}
      transition="all 0.2s ease"
    >
      <HStack align="start" spacing={4}>
        <Flex
          minW="44px"
          h="44px"
          align="center"
          justify="center"
          borderRadius="xl"
          bg="orange.400"
          color="black"
        >
          <Icon as={icon} boxSize={5} />
        </Flex>

        <VStack align="start" spacing={1}>
          <Text color="gray.400" fontSize="sm">
            {label}
          </Text>
          <Text color="white" fontWeight="semibold" wordBreak="break-word">
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  )
}