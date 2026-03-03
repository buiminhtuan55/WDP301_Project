import { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import authService from "../../services/authService";

const AdminAndStaffLoginPage = () => {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0;
  }, [email, password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = await authService.adminLogin(email, password);
      toast({
        title: "Dang nhap admin/staff thanh cong",
        description: `Vai tro: ${payload.user.role}`,
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
    <Box minH="100vh" bg="gray.100" py={10} px={4}>
      <Box
        maxW="420px"
        mx="auto"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        p={8}
        boxShadow="md"
      >
        <Heading size="lg" mb={2}>
          Admin/Staff Login
        </Heading>
        <Text color="gray.600" mb={6}>
          Chi tai khoan role admin, LV1, LV2 duoc phep truy cap.
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cinemago.com"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Mat khau</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhap mat khau"
              />
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
              Dang nhap tai khoan khach hang? <RouterLink to="/login">Quay lai</RouterLink>
            </Text>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};

export default AdminAndStaffLoginPage;
