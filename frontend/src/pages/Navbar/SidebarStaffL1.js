import {
  VStack,
  Box,
  Link,
  Icon,
  Text,
  Flex,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { FaFilm, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useRef } from "react";
import authService from "../../services/authService";

const links = [
  { to: "/staff/l1", label: "Danh sách phim", icon: FaFilm, end: true },
  { to: "/staff/profile", label: "Thông tin nhân viên", icon: FaUser, end: true },
];

export default function SidebarStaffL1() {
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const staffRaw = localStorage.getItem("staff");
  let staff = { name: "Nhân viên" };
  try {
    const parsed = staffRaw ? JSON.parse(staffRaw) : null;
    if (parsed) {
      staff = {
        ...parsed,
        name: parsed.fullName || parsed.username || "Nhân viên",
      };
    }
  } catch (_) {
    /* ignore */
  }

  const handleLogout = () => {
    authService.clearAuthData();
    onClose();
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  };

  const activeColor = "orange.400";

  return (
    <Flex
      as="aside"
      direction="column"
      justify="space-between"
      w={{ base: "full", md: "260px" }}
      minW={{ md: "260px" }}
      bg="#11141d"
      color="white"
      borderRight="1px solid"
      borderColor="whiteAlpha.100"
      minH="100vh"
      position="sticky"
      top={0}
      left={0}
    >
      <Box p={5}>
        <Box mb={6} pb={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="2xl" fontWeight="bold" color="orange.400" mb={1}>
            CINEMAGO
          </Text>
          <Flex align="center" gap={2} mb={2}>
            <Box w={2} h={2} borderRadius="full" bg="green.400" />
            <Text fontSize="sm" fontWeight="semibold" color="gray.200">
              Nhân viên
            </Text>
          </Flex>
          <Text fontSize="xs" color="gray.500" noOfLines={2}>
            {staff.name}
          </Text>
        </Box>

        <VStack align="stretch" spacing={1}>
          {links.map((item) => {
            const isActive =
              item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                as={NavLink}
                to={item.to}
                end={item.end}
                p={3}
                borderRadius="lg"
                transition="all 0.2s"
                _hover={{
                  bg: "whiteAlpha.100",
                  color: "white",
                  transform: "translateX(4px)",
                }}
                bg={isActive ? activeColor : "transparent"}
                fontWeight={isActive ? "bold" : "medium"}
                color={isActive ? "white" : "gray.400"}
                textDecoration="none"
                _focus={{ boxShadow: "none" }}
                borderWidth="1px"
                borderColor={isActive ? "orange.300" : "transparent"}
              >
                <Flex align="center" gap={3}>
                  <Icon
                    as={item.icon}
                    boxSize={5}
                    color={isActive ? "white" : "gray.400"}
                  />
                  <Text fontSize="sm">{item.label}</Text>
                </Flex>
              </Link>
            );
          })}
        </VStack>
      </Box>

      <Box p={5} borderTop="1px solid" borderColor="whiteAlpha.100">
        <Button
          w="100%"
          variant="outline"
          colorScheme="red"
          borderColor="red.400"
          color="red.300"
          leftIcon={<FaSignOutAlt />}
          _hover={{ bg: "red.900", borderColor: "red.300", color: "white" }}
          onClick={onOpen}
        >
          Đăng xuất
        </Button>
      </Box>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="#1a1d29" color="white" borderColor="whiteAlpha.200">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xác nhận đăng xuất
            </AlertDialogHeader>
            <AlertDialogBody>Bạn có chắc chắn muốn đăng xuất không?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Hủy
              </Button>
              <Button colorScheme="red" onClick={handleLogout} ml={3}>
                Đăng xuất
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
}
