import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Spinner,
  Center,
  SimpleGrid,
  Badge,
  Button,
  useToast,
  Divider,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import apiService from "../../services/apiService";
import authService from "../../services/authService";
import SidebarStaffL1 from "../Navbar/SidebarStaffL1";
import SidebarStaff from "../Navbar/SidebarStaff";
import SidebarAdmin from "../Navbar/SidebarAdmin";

function normalizeRoleLabel(role) {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "Quản trị viên";
  if (r === "lv1") return "Nhân viên";
  return role || "—";
}

function formatDate(value) {
  if (!value) return "—";
  try {
    const d = typeof value === "string" ? parseISO(value) : new Date(value);
    if (!isValid(d)) return "—";
    return format(d, "dd/MM/yyyy HH:mm");
  } catch {
    return "—";
  }
}

function getStaffRoleFromStorage() {
  let role = (localStorage.getItem("userRole") || "").toLowerCase();
  if (!role) {
    try {
      const roleData = JSON.parse(localStorage.getItem("role"));
      role = (roleData?.role || "").toLowerCase();
    } catch {
      /* ignore */
    }
  }
  if (!role) {
    try {
      const staffData = JSON.parse(localStorage.getItem("staff"));
      role = (staffData?.role || "").toLowerCase();
    } catch {
      /* ignore */
    }
  }
  return role;
}

export default function StaffProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const [role, setRole] = useState("");

  const loadProfile = useCallback(() => {
    setLoading(true);
    apiService.get("/profile-detail", {}, (data, success) => {
      setLoading(false);
      if (success && data?.data) {
        setProfile(data.data);
        return;
      }
      const local = authService.getUser();
      if (local) {
        setProfile({
          id: local.id || local._id,
          username: local.username,
          email: local.email,
          fullName: local.fullName,
          role: local.role,
          status: local.status,
        });
        toast({
          title: "Đang hiển thị dữ liệu cục bộ",
          description: "Không tải được hồ sơ mới nhất từ máy chủ.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      toast({
        title: "Không có dữ liệu",
        description: data?.message || "Vui lòng đăng nhập lại.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    });
  }, [toast]);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) {
      toast({
        title: "Yêu cầu đăng nhập",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate("/login", { replace: true });
      return;
    }

    const r = getStaffRoleFromStorage();
    setRole(r);

    if (r !== "lv1" && r !== "admin") {
      toast({
        title: "Không có quyền",
        description: "Trang này chỉ dành cho nhân viên hoặc quản trị.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      navigate("/", { replace: true });
      return;
    }

    loadProfile();
  }, [navigate, toast, loadProfile]);

  const goBack = () => {
    const r = role || getStaffRoleFromStorage();
    if (r === "admin") {
      navigate("/admin/dashboard");
      return;
    }
    navigate("/staff/l1");
  };

  const sidebarRole = role || getStaffRoleFromStorage();
  const displayName =
    profile?.fullName?.trim() ||
    profile?.username ||
    authService.getUser()?.username ||
    "Nhân viên";

  const sidebar =
    sidebarRole === "lv1"
      ? <SidebarStaffL1 />
      : sidebarRole === "admin"
        ? <SidebarAdmin />
        : <SidebarStaff />;

  return (
    <Flex minH="100vh" bg="#181a20" color="white">
      {sidebar}
      <Box flex="1" p={{ base: 4, md: 8 }} overflow="auto">
        <Button
          leftIcon={<ArrowBackIcon />}
          variant="ghost"
          color="gray.300"
          mb={6}
          _hover={{ bg: "whiteAlpha.100", color: "white" }}
          onClick={goBack}
        >
          Quay lại
        </Button>

        {loading ? (
          <Center py={20}>
            <Spinner size="xl" color="orange.400" />
          </Center>
        ) : (
          <Box maxW="720px">
            <VStack align="stretch" spacing={6}>
              <HStack spacing={4} align="flex-start">
                <Avatar
                  size="2xl"
                  name={displayName}
                  bg="orange.500"
                  color="white"
                />
                <VStack align="start" spacing={1} pt={1}>
                  <Heading size="lg" color="orange.300">
                    Thông tin nhân viên
                  </Heading>
                  <Text color="gray.400" fontSize="md">
                    {displayName}
                  </Text>
                  <Badge
                    colorScheme="orange"
                    variant="subtle"
                    fontSize="0.75rem"
                    textTransform="none"
                  >
                    {normalizeRoleLabel(profile?.role)}
                  </Badge>
                </VStack>
              </HStack>

              <Box
                bg="#23242a"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="whiteAlpha.100"
                p={{ base: 5, md: 8 }}
                boxShadow="xl"
              >
                <Text fontSize="sm" color="gray.500" mb={4} textTransform="uppercase" letterSpacing="wider">
                  Chi tiết tài khoản
                </Text>
                <Divider borderColor="whiteAlpha.100" mb={6} />

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  <Field label="Tên đăng nhập" value={profile?.username} />
                  <Field label="Email" value={profile?.email} />
                  <Field label="Họ và tên" value={profile?.fullName || "—"} />
                  <Field
                    label="Trạng thái"
                    value={
                      profile?.status === "active"
                        ? "Hoạt động"
                        : profile?.status === "locked"
                          ? "Đã khóa"
                          : profile?.status === "suspended"
                            ? "Tạm ngưng"
                            : profile?.status || "—"
                    }
                  />
                  <Field label="Ngày tạo" value={formatDate(profile?.createdAt)} />
                  <Field label="Cập nhật lần cuối" value={formatDate(profile?.updatedAt)} />
                </SimpleGrid>
              </Box>
            </VStack>
          </Box>
        )}
      </Box>
    </Flex>
  );
}

function Field({ label, value }) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500" mb={1}>
        {label}
      </Text>
      <Text fontSize="sm" color="gray.100" wordBreak="break-word">
        {value ?? "—"}
      </Text>
    </Box>
  );
}
