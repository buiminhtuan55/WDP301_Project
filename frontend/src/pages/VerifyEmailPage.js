import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Spinner,
  Center,
  Input,
  useToast,
  HStack,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState('loading'); // loading, success, error, already_verified
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('no_token');
      setMessage('Không tìm thấy token xác thực. Vui lòng kiểm tra lại link trong email.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${backendUrl}/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          if (data.message?.includes('trước đó')) {
            setStatus('already_verified');
          } else {
            setStatus('success');
          }
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || 'Xác thực thất bại. Vui lòng thử lại.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Không thể kết nối đến server. Vui lòng thử lại sau.');
      }
    };

    verifyEmail();
  }, [location, backendUrl]);

  const handleResend = async () => {
    if (!resendEmail) {
      toast({ title: 'Vui lòng nhập email', status: 'warning', duration: 3000 });
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch(`${backendUrl}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: data.message, status: 'success', duration: 5000, isClosable: true });
      } else {
        toast({ title: data.message, status: 'error', duration: 5000, isClosable: true });
      }
    } catch (err) {
      toast({ title: 'Lỗi kết nối', status: 'error', duration: 3000 });
    }
    setIsResending(false);
  };

  return (
    <Box minH="100vh" bg="#060b16" position="relative" overflow="hidden">
      {/* Background */}
      <Box
        position="absolute"
        inset="0"
        bgImage="url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80')"
        bgSize="cover"
        bgPosition="center"
        transform="scale(1.05)"
        filter="blur(4px)"
      />
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(135deg, rgba(4,8,20,0.95) 0%, rgba(7,10,20,0.86) 40%, rgba(10,8,16,0.92) 100%)"
      />

      {/* Glow effects */}
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
        bg="blue.400"
        opacity={0.12}
        borderRadius="full"
        filter="blur(140px)"
      />

      <Container maxW="600px" position="relative" zIndex={2}>
        <Center minH="100vh">
          <Box
            w="full"
            p={{ base: 8, md: 12 }}
            rounded="32px"
            border="1px solid rgba(255,255,255,0.08)"
            bg="rgba(8, 15, 30, 0.85)"
            backdropFilter="blur(22px)"
            boxShadow="0 30px 100px rgba(0,0,0,0.55)"
          >
            {status === 'loading' && (
              <VStack spacing={6}>
                <Spinner size="xl" color="orange.400" thickness="4px" />
                <Heading color="white" size="md">Đang xác thực email...</Heading>
                <Text color="gray.400" textAlign="center">
                  Vui lòng đợi trong giây lát
                </Text>
              </VStack>
            )}

            {status === 'success' && (
              <VStack spacing={6}>
                <Box
                  p={4}
                  rounded="full"
                  bg="rgba(72, 187, 120, 0.15)"
                >
                  <CheckCircleIcon boxSize={16} color="green.400" />
                </Box>
                <Heading color="white" size="lg" textAlign="center">
                  Xác thực thành công! 🎉
                </Heading>
                <Text color="gray.300" textAlign="center" fontSize="md">
                  {message}
                </Text>
                <Button
                  w="full"
                  h="56px"
                  rounded="16px"
                  bg="linear-gradient(90deg, #f59e0b, #f97316)"
                  color="white"
                  fontSize="md"
                  fontWeight="700"
                  onClick={() => navigate('/login')}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 18px 36px rgba(249,115,22,0.32)',
                  }}
                  _active={{ transform: 'translateY(0)' }}
                >
                  Đăng nhập ngay
                </Button>
              </VStack>
            )}

            {status === 'already_verified' && (
              <VStack spacing={6}>
                <Box p={4} rounded="full" bg="rgba(66, 153, 225, 0.15)">
                  <CheckCircleIcon boxSize={16} color="blue.400" />
                </Box>
                <Heading color="white" size="lg" textAlign="center">
                  Đã xác thực
                </Heading>
                <Text color="gray.300" textAlign="center" fontSize="md">
                  {message}
                </Text>
                <Button
                  w="full"
                  h="56px"
                  rounded="16px"
                  bg="linear-gradient(90deg, #f59e0b, #f97316)"
                  color="white"
                  fontSize="md"
                  fontWeight="700"
                  onClick={() => navigate('/login')}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 18px 36px rgba(249,115,22,0.32)',
                  }}
                >
                  Đến trang đăng nhập
                </Button>
              </VStack>
            )}

            {(status === 'error' || status === 'no_token') && (
              <VStack spacing={6}>
                <Box p={4} rounded="full" bg="rgba(245, 101, 101, 0.15)">
                  <WarningIcon boxSize={16} color="red.400" />
                </Box>
                <Heading color="white" size="lg" textAlign="center">
                  Xác thực thất bại
                </Heading>
                <Text color="gray.300" textAlign="center" fontSize="md">
                  {message}
                </Text>

                {/* Resend form */}
                <Box
                  w="full"
                  p={5}
                  rounded="22px"
                  bg="rgba(255,255,255,0.04)"
                  border="1px solid rgba(255,255,255,0.08)"
                >
                  <VStack spacing={4} align="stretch">
                    <Text color="gray.300" fontSize="sm">
                      Nhập email để gửi lại link xác thực mới:
                    </Text>
                    <Input
                      h="52px"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Nhập email của bạn"
                      type="email"
                      color="white"
                      bg="rgba(255,255,255,0.06)"
                      border="1px solid rgba(255,255,255,0.10)"
                      rounded="14px"
                      _placeholder={{ color: 'gray.500' }}
                      _hover={{ borderColor: 'orange.300' }}
                      _focus={{
                        borderColor: 'orange.400',
                        boxShadow: '0 0 0 1px #fb923c',
                      }}
                    />
                    <HStack>
                      <Button
                        colorScheme="orange"
                        rounded="14px"
                        isLoading={isResending}
                        onClick={handleResend}
                      >
                        Gửi lại email
                      </Button>
                      <Button
                        variant="ghost"
                        color="gray.300"
                        rounded="14px"
                        onClick={() => navigate('/login')}
                      >
                        Về trang đăng nhập
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            )}
          </Box>
        </Center>
      </Container>
    </Box>
  );
};

export default VerifyEmailPage;
