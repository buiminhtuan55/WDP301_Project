import { Box, ChakraProvider, Heading, Text, VStack } from "@chakra-ui/react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

// --- KHU VỰC IMPORT COMPONENTS (Sẽ mở comment khi copy code các trang sang) ---
// import HomePage from "./pages/HomePage";
// import LoginPage from "./pages/Login";
// import DashboardPage from "./pages/admin/DashboardPage";
// ... (Các import khác)

function App() {
    return (
        <ChakraProvider>
            <Router>
                <Box minHeight="100vh" display="flex" flexDirection="column">
                    {/* Header sẽ đặt ở đây */}
                    {/* <Header /> */}

                    <Box flex="1" p={5}>
                        <Routes>
                            {/* --- ROUTE MẪU CHO BASE PROJECT --- */}
                            <Route path="/" element={
                                <VStack spacing={4} mt={10}>
                                    <Heading color="teal.500">CinemaGo Base Project</Heading>
                                    <Text fontSize="xl">Project đã khởi chạy thành công! 🚀</Text>
                                    <Box bg="gray.100" p={4} borderRadius="md">
                                        <Text>Anh em dev lưu ý:</Text>
                                        <Text>- Code giao diện đặt trong thư mục <b>src/components</b></Text>
                                        <Text>- Các trang chính đặt trong thư mục <b>src/pages</b></Text>
                                        <Text>- Mở file <b>App.js</b> để thêm Route mới.</Text>
                                    </Box>
                                </VStack>
                            } />

                            {/* --- SAU NÀY SẼ UNCOMMENT CÁC ROUTE DƯỚI ĐÂY --- */}

                            {/* Auth Routes */}
                            {/* <Route path="/login" element={<LoginPage />} /> */}
                            {/* <Route path="/register" element={<RegisterPage />} /> */}

                            {/* Admin Routes */}
                            {/* <Route path="/admin/dashboard" element={<DashboardPage />} /> */}

                            {/* Staff Routes */}
                            {/* <Route path="/staff/l1" element={<StaffL1Page />} /> */}

                        </Routes>
                    </Box>

                    {/* Footer sẽ đặt ở đây */}
                    {/* <Footer /> */}
                </Box>
            </Router>
        </ChakraProvider>
    );
}

export default App;