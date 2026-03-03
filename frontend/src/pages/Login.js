import { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import authService from "../services/authService";

const Login = () => {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0;
  }, [email, password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = await authService.login(email, password);
      toast({
        title: "Dang nhap thanh cong",
        description: `Xin chao ${payload.user.username}`,
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Dang nhap that bai",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={10} px={4}>
      <Box
        maxW="420px"
        mx="auto"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        p={8}
        boxShadow="sm"
      >
        <Heading size="lg" mb={2}>
          Dang nhap
        </Heading>
        <Text color="gray.600" mb={6}>
          Su dung email va mat khau cua ban de tiep tuc.
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Mat khau</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhap mat khau"
                />
                <InputRightElement width="4.5rem">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "An" : "Hien"}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
              isDisabled={!canSubmit}
            >
              Dang nhap
            </Button>

            <Text fontSize="sm" color="gray.600">
              Trang danh rieng cho nhan su:{" "}
              <RouterLink to="/admin/login">Admin/Staff Login</RouterLink>
            </Text>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};

export default Login;
