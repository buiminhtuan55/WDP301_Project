import { useState } from "react"
import {
  Container,
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  useToast,
  Text,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  IconButton,
  HStack,
  Flex,
  Divider,
  Icon,
  Progress,
} from "@chakra-ui/react"
import {
  ViewIcon,
  ViewOffIcon,
  ArrowBackIcon,
  LockIcon,
} from "@chakra-ui/icons"
import { FiShield, FiKey } from "react-icons/fi"
import apiService from "../services/apiService"
import { useNavigate } from "react-router-dom"

export default function ChangePasswordPage() {
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [loading, setLoading] = useState(false)

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const toast = useToast()
  const navigate = useNavigate()

  // 🔥 đánh giá độ mạnh password
  const getStrength = () => {
    let score = 0
    if (newPwd.length >= 6) score++
    if (/[A-Z]/.test(newPwd)) score++
    if (/[0-9]/.test(newPwd)) score++
    if (/[^A-Za-z0-9]/.test(newPwd)) score++
    return score
  }

  const strength = getStrength()

  const handleSubmit = () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      return toast({ title: "Nhập đầy đủ thông tin", status: "warning" })
    }

    if (newPwd !== confirmPwd) {
      return toast({ title: "Mật khẩu xác nhận không khớp", status: "warning" })
    }

    if (newPwd.length < 6) {
      return toast({ title: "Mật khẩu phải >= 6 ký tự", status: "warning" })
    }

    setLoading(true)

    apiService.put(
      "/change-password",
      {
        currentPassword: currentPwd,
        newPassword: newPwd,
      },
      (res, success) => {
        setLoading(false)

        if (success) {
          toast({
            title: res?.message || "Đổi mật khẩu thành công",
            status: "success",
          })

          setTimeout(() => {
            navigate("/profile")
            window.location.reload()
          }, 700)
        } else {
          toast({ title: res?.message || "Lỗi", status: "error" })
        }
      }
    )
  }

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #05070d 0%, #0b1220 50%, #111827 100%)"
      position="relative"
      py={12}
    >
      {/* Glow background */}
      <Box
        position="absolute"
        top="-100px"
        left="-100px"
        w="300px"
        h="300px"
        bg="orange.500"
        opacity={0.12}
        filter="blur(120px)"
        borderRadius="full"
      />
      <Box
        position="absolute"
        bottom="-120px"
        right="-120px"
        w="320px"
        h="320px"
        bg="red.500"
        opacity={0.1}
        filter="blur(140px)"
        borderRadius="full"
      />

      <Container maxW="520px">
        <Box
          bg="rgba(10, 15, 25, 0.85)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="3xl"
          boxShadow="0 25px 80px rgba(0,0,0,0.45)"
          backdropFilter="blur(16px)"
          overflow="hidden"
        >
          {/* HEADER */}
          <Box
            p={6}
            bgGradient="linear(to-r, rgba(249,115,22,0.2), rgba(239,68,68,0.1))"
          >
            <HStack justify="space-between">
              <VStack align="start">
                <Flex
                  w="50px"
                  h="50px"
                  align="center"
                  justify="center"
                  borderRadius="xl"
                  bg="orange.400"
                  color="black"
                >
                  <Icon as={FiShield} />
                </Flex>

                <Heading color="white" size="md">
                  Đổi mật khẩu
                </Heading>
                <Text color="gray.300" fontSize="sm">
                  Bảo mật tài khoản của bạn
                </Text>
              </VStack>

              <Button
                leftIcon={<ArrowBackIcon />}
                variant="ghost"
                color="gray.300"
                onClick={() => navigate("/profile")}
              >
                Quay lại
              </Button>
            </HStack>
          </Box>

          {/* FORM */}
          <Box p={6}>
            <VStack spacing={5}>
              {/* CURRENT */}
              <FormControl>
                <FormLabel color="gray.200">Mật khẩu hiện tại</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <LockIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    bg="gray.900"
                    color="white"
                    borderRadius="xl"
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showCurrent ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowCurrent(!showCurrent)}
                      variant="ghost"
                      color="gray.300"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* NEW */}
              <FormControl>
                <FormLabel color="gray.200">Mật khẩu mới</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FiKey color="gray" />
                  </InputLeftElement>
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    bg="gray.900"
                    color="white"
                    borderRadius="xl"
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showNew ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowNew(!showNew)}
                      variant="ghost"
                      color="gray.300"
                    />
                  </InputRightElement>
                </InputGroup>

                {/* Strength */}
                <Progress
                  value={strength * 25}
                  size="xs"
                  mt={2}
                  borderRadius="full"
                  colorScheme={
                    strength <= 1
                      ? "red"
                      : strength === 2
                      ? "yellow"
                      : "green"
                  }
                />
              </FormControl>

              {/* CONFIRM */}
              <FormControl>
                <FormLabel color="gray.200">Xác nhận mật khẩu</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <LockIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    bg="gray.900"
                    color="white"
                    borderRadius="xl"
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showConfirm ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowConfirm(!showConfirm)}
                      variant="ghost"
                      color="gray.300"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Divider />

              <Button
                w="full"
                h="48px"
                bg="orange.400"
                color="black"
                fontWeight="bold"
                borderRadius="xl"
                _hover={{ bg: "orange.300" }}
                onClick={handleSubmit}
                isLoading={loading}
              >
                Lưu mật khẩu
              </Button>
            </VStack>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}