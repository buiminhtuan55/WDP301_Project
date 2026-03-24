import {
  Box,
  Button,
  VStack,
  HStack,
  Input,
  Text,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Avatar,
  Spinner,
  Badge,
  Card,
  CardBody,
  Image,
  Link,
  Divider,
} from "@chakra-ui/react";
import { ChatIcon, CloseIcon } from "@chakra-ui/icons";
import { useState, useRef, useEffect } from "react";
import apiService from "../services/apiService";
import { useNavigate } from "react-router-dom";

const Chatbot = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Xin chào! Tôi là trợ lý ảo của CINEMAGO. Tôi có thể giúp bạn về: phim đang chiếu, đặt vé, combo, giá vé, và các dịch vụ khác của CINEMAGO. Bạn cần hỗ trợ gì?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Thêm tin nhắn của user vào danh sách
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: userMessage,
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);

    // Gửi tin nhắn đến API
    apiService.post(
      "/api/ai/chat",
      { message: userMessage },
      (data, success) => {
        setIsLoading(false);
        
        if (success) {
          const botMessage = {
            type: "bot",
            text: data.message || "Xin lỗi, tôi không hiểu câu hỏi của bạn.",
            timestamp: new Date(),
            data: data.data || null,
            isCinemagoRelated: data.isCinemagoRelated !== false,
          };
          
          setMessages((prev) => [...prev, botMessage]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
              timestamp: new Date(),
            },
          ]);
        }
      }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessageData = (data, dataType) => {
    if (!data) return null;

    if (Array.isArray(data)) {
      if (data.length === 0) return null;

      // Nếu là dữ liệu showtime (có movie và showtimes)
      if (data[0].movie && data[0].showtimes) {
        return (
          <VStack align="stretch" spacing={3} mt={2}>
            {data.map((item, idx) => (
              <Card key={idx} bg="gray.700" size="sm">
                <CardBody p={3}>
                  <HStack spacing={2} mb={2}>
                    {item.movie.poster_url && (
                      <Image
                        src={item.movie.poster_url}
                        alt={item.movie.title}
                        boxSize="60px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="bold" color="orange.400">
                        {item.movie.title}
                      </Text>
                      {item.movie.genre && item.movie.genre.length > 0 && (
                        <Text fontSize="xs" color="gray.300">
                          {item.movie.genre.join(", ")}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <Divider borderColor="gray.600" my={2} />
                  <VStack align="stretch" spacing={1}>
                    <Text fontSize="xs" color="gray.400" fontWeight="bold" mb={1}>
                      Suất chiếu:
                    </Text>
                    {item.showtimes && item.showtimes.length > 0 ? (
                      item.showtimes.slice(0, 5).map((showtime, stIdx) => (
                      <Box
                        key={stIdx}
                        bg="gray.800"
                        p={2}
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.600"
                      >
                        <HStack spacing={2} justify="space-between">
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="xs" color="orange.300" fontWeight="bold">
                              {showtime.time}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              {showtime.theater} - {showtime.room}
                            </Text>
                            {showtime.location && (
                              <Text fontSize="xs" color="gray.500">
                                {showtime.location}
                              </Text>
                            )}
                          </VStack>
                          <Button
                            size="xs"
                            colorScheme="orange"
                            onClick={() => {
                              navigate(`/bookings/showtimes/${item.movie._id}`);
                              onClose();
                            }}
                          >
                            Đặt vé
                          </Button>
                        </HStack>
                      </Box>
                      ))
                    ) : (
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        Chưa có suất chiếu
                      </Text>
                    )}
                    {item.showtimes && item.showtimes.length > 5 && (
                      <Text fontSize="xs" color="gray.400" textAlign="center" mt={1}>
                        ... và {item.showtimes.length - 5} suất chiếu khác
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        );
      }

      // Nếu là danh sách phim
      if (data[0].title) {
        return (
          <VStack align="stretch" spacing={2} mt={2}>
            {data.slice(0, 5).map((movie) => (
              <Card
                key={movie._id}
                bg="gray.700"
                size="sm"
                cursor="pointer"
                _hover={{ bg: "gray.600" }}
                onClick={() => {
                  navigate(`/movies/${movie._id}`);
                  onClose();
                }}
              >
                <CardBody p={2}>
                  <HStack spacing={2}>
                    {movie.poster_url && (
                      <Image
                        src={movie.poster_url}
                        alt={movie.title}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="bold" color="orange.400">
                        {movie.title}
                      </Text>
                      {movie.genre && movie.genre.length > 0 && (
                        <Text fontSize="xs" color="gray.300">
                          {movie.genre.join(", ")}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
            {data.length > 5 && (
              <Text fontSize="xs" color="gray.400" textAlign="center">
                ... và {data.length - 5} phim khác
              </Text>
            )}
          </VStack>
        );
      }

      // Nếu là danh sách thể loại
      if (typeof data[0] === "string") {
        return (
          <HStack wrap="wrap" spacing={2} mt={2}>
            {data.map((genre, idx) => (
              <Badge key={idx} colorScheme="orange" fontSize="sm" p={1}>
                {genre}
              </Badge>
            ))}
          </HStack>
        );
      }

      // Nếu là danh sách combo
      if (data[0].name) {
        return (
          <VStack align="stretch" spacing={2} mt={2}>
            {data.map((combo) => {
              // Xử lý giá combo - sửa lỗi NaN
              let priceDisplay = 'Liên hệ';
              if (combo.price) {
                try {
                  const priceValue = typeof combo.price === 'object' && combo.price.toString 
                    ? parseFloat(combo.price.toString()) 
                    : parseFloat(combo.price);
                  if (!isNaN(priceValue) && isFinite(priceValue)) {
                    priceDisplay = priceValue.toLocaleString("vi-VN") + " đ";
                  }
                } catch (e) {
                  console.error('Error parsing combo price:', e);
                }
              }
              
              return (
                <Card key={combo._id} bg="gray.700" size="sm">
                  <CardBody p={2}>
                    <Text fontSize="sm" fontWeight="bold" color="orange.400">
                      {combo.name}
                    </Text>
                    {combo.description && (
                      <Text fontSize="xs" color="gray.300" mt={1}>
                        {combo.description}
                      </Text>
                    )}
                    <Text fontSize="xs" color="orange.400" mt={1}>
                      {priceDisplay}
                    </Text>
                  </CardBody>
                </Card>
              );
            })}
          </VStack>
        );
      }
    }

    return null;
  };

  return (
    <>
      {/* Chatbot Button */}
      <Box
        position="fixed"
        bottom="20px"
        right="20px"
        zIndex={1000}
      >
        <IconButton
          aria-label="Mở chatbot"
          icon={<ChatIcon />}
          size="lg"
          colorScheme="orange"
          borderRadius="full"
          boxShadow="lg"
          onClick={onOpen}
          _hover={{ transform: "scale(1.1)" }}
          transition="all 0.2s"
        />
      </Box>

      {/* Chatbot Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg="gray.900" color="white">
          <DrawerHeader
            borderBottomWidth="1px"
            borderColor="gray.700"
            bg="gray.800"
          >
            <HStack spacing={3}>
              <Avatar size="sm" bg="orange.400" name="CINEMAGO Bot" />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" color="orange.400">
                  CINEMAGO Assistant
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Trợ lý ảo của bạn
                </Text>
              </VStack>
            </HStack>
          </DrawerHeader>
          <DrawerCloseButton color="gray.300" />

          <DrawerBody p={0}>
            <VStack
              spacing={4}
              p={4}
              h="100%"
              overflowY="auto"
              align="stretch"
            >
              {messages.map((msg, idx) => (
                <Box
                  key={idx}
                  alignSelf={msg.type === "user" ? "flex-end" : "flex-start"}
                  maxW="80%"
                >
                  <HStack
                    spacing={2}
                    align="start"
                    flexDirection={msg.type === "user" ? "row-reverse" : "row"}
                  >
                    <Avatar
                      size="sm"
                      bg={msg.type === "user" ? "blue.400" : "orange.400"}
                      name={msg.type === "user" ? "Bạn" : "Bot"}
                    />
                    <Box
                      bg={msg.type === "user" ? "blue.500" : "gray.700"}
                      p={3}
                      borderRadius="lg"
                      maxW="100%"
                    >
                      <Text fontSize="sm" whiteSpace="pre-wrap">
                        {msg.text}
                      </Text>
                      {renderMessageData(msg.data)}
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {formatTime(msg.timestamp)}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))}
              {isLoading && (
                <Box alignSelf="flex-start">
                  <HStack spacing={2}>
                    <Avatar size="sm" bg="orange.400" name="Bot" />
                    <Box bg="gray.700" p={3} borderRadius="lg">
                      <Spinner size="sm" color="orange.400" />
                    </Box>
                  </HStack>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </VStack>
          </DrawerBody>

          <DrawerFooter
            borderTopWidth="1px"
            borderColor="gray.700"
            bg="gray.800"
            p={4}
          >
            <HStack spacing={2} w="100%">
              <Input
                ref={inputRef}
                placeholder="Nhập câu hỏi của bạn..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _focus={{ borderColor: "orange.400" }}
                isDisabled={isLoading}
              />
              <Button
                colorScheme="orange"
                onClick={handleSendMessage}
                isDisabled={!inputMessage.trim() || isLoading}
              >
                Gửi
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Chatbot;
