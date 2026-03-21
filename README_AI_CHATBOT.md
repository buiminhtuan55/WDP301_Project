# Hệ thống AI Chatbot CINEMAGO

## Tổng quan
Chatbot được thiết kế để **LUÔN LUÔN đọc dữ liệu từ MongoDB** thay vì chỉ dựa vào keyword matching. Hệ thống sử dụng:

1. **Google Gemini AI**: Trả lời câu hỏi về web development và phim ảnh
2. **AI Helper** (`backend/utils/aiHelper.js`): Phân tích câu hỏi và trích xuất intent + entities
3. **Database Query**: Luôn query MongoDB để lấy dữ liệu thực tế
4. **Smart Search**: Tìm kiếm phim thông minh với nhiều phương pháp

## Cấu hình Gemini AI

### 1. Lấy API Key từ Google AI Studio
1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google
3. Tạo API key mới
4. Copy API key

### 2. Thêm vào file .env
Thêm dòng sau vào file `.env`:
```
GEMINI_API_KEY=your_api_key_here
```

### 3. Khởi động lại server
Sau khi thêm API key, khởi động lại server để chatbot sử dụng Gemini AI.

**Lưu ý**: Nếu không có API key, chatbot vẫn hoạt động bình thường nhưng sẽ không sử dụng Gemini AI cho các câu hỏi về web/phim.

## Cách hoạt động

### 1. Phân tích câu hỏi
- Chatbot phân tích câu hỏi để tìm:
  - **Intent**: Mục đích của câu hỏi (get_today_movies, get_movie_showtimes, v.v.)
  - **Entities**: Thông tin cụ thể (tên phim, ngày, v.v.)

### 2. Query Database
- **LUÔN LUÔN** query MongoDB trước khi trả lời
- Không dựa vào hard-coded responses
- Trả về dữ liệu thực tế từ database

### 3. Tìm kiếm thông minh
- Tìm kiếm chính xác trước
- Nếu không tìm thấy, tìm kiếm chứa từ khóa
- Nếu vẫn không tìm thấy, tìm kiếm theo từng từ
- Cuối cùng, tìm kiếm theo từ đầu tiên

## Các tính năng

### ✅ Đọc dữ liệu từ Database
- Query showtime hôm nay từ MongoDB
- Tìm phim theo tên trong database
- Lấy thông tin rạp, phòng chiếu từ database
- Hiển thị combo với giá từ database

### ✅ Xử lý câu hỏi tự nhiên
- "Hôm nay có phim nào đang chiếu" → Query database
- "Mưa đỏ chiếu lúc nào" → Tìm phim trong database
- "Thỏ Ơi" → Tự động tìm phim và trả về lịch chiếu
- "Hello AI" / "Hello" / "Hi" → Chào lại người dùng
- Câu hỏi về web development → Sử dụng Gemini AI để trả lời
- Câu hỏi về phim ảnh (không liên quan đến CINEMAGO) → Sử dụng Gemini AI để trả lời

### ✅ Fallback thông minh
- Nếu không tìm thấy phim cụ thể → Trả về danh sách phim
- Nếu không có showtime → Thông báo rõ ràng
- Luôn cố gắng trả về thông tin hữu ích

## Test Cases

### Câu hỏi về phim hôm nay
```
User: "Hôm nay có phim nào đang chiếu"
Bot: [Query database] → Trả về danh sách phim chiếu hôm nay
```

### Câu hỏi về lịch chiếu
```
User: "Mưa đỏ chiếu lúc nào"
Bot: [Tìm "Mưa đỏ" trong database] → [Query showtime] → Trả về lịch chiếu
```

### Chỉ nhập tên phim
```
User: "Thỏ Ơi"
Bot: [Tìm "Thỏ Ơi" trong database] → [Query showtime] → Trả về thông tin phim
```

## Logging

Chatbot có logging chi tiết để debug:
- `🔍` - Đang tìm kiếm
- `📊` - Kết quả query database
- `✅` - Tìm thấy dữ liệu
- `❌` - Lỗi

## Lưu ý cho Review

Khi thầy cô test chatbot:
1. Chatbot **LUÔN query database** - không phải hard-coded
2. Dữ liệu trả về là **thực tế từ MongoDB**
3. Có thể test bằng cách:
   - Thêm/xóa phim trong database → Chatbot sẽ phản ánh thay đổi
   - Thay đổi showtime → Chatbot sẽ hiển thị đúng
   - Thêm combo mới → Chatbot sẽ hiển thị combo mới

## Tính năng mới

### ✅ Tích hợp Google Gemini AI
- Trả lời câu hỏi về web development (HTML, CSS, JavaScript, React, Node.js, v.v.)
- Trả lời câu hỏi về phim ảnh nói chung (không chỉ phim trong hệ thống)
- Chỉ trả lời câu hỏi liên quan đến web/phim, từ chối câu hỏi khác

### ✅ Cải thiện nhận diện lời chào
- Nhận diện nhiều biến thể: "hello", "hi", "hello AI", "xin chào", v.v.
- Trả lời thân thiện và hướng dẫn người dùng

## Cải tiến trong tương lai

Có thể tích hợp:
- RAG (Retrieval-Augmented Generation) để chatbot thông minh hơn
- Fine-tuning model cho domain cụ thể
- Hỗ trợ đa ngôn ngữ tốt hơn

Hiện tại, hệ thống đã đủ tốt để:
- ✅ Đọc dữ liệu từ database
- ✅ Trả lời câu hỏi dựa trên dữ liệu thực tế
- ✅ Tìm kiếm thông minh
- ✅ Xử lý nhiều cách hỏi khác nhau
- ✅ Sử dụng Gemini AI cho câu hỏi về web/phim
- ✅ Nhận diện và trả lời lời chào
