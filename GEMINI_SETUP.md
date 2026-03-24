# Hướng dẫn cấu hình Gemini AI

## Bước 1: Lấy API Key từ Google AI Studio

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google của bạn
3. Click vào nút **"Create API Key"** hoặc **"Get API Key"**
4. Chọn project hoặc tạo project mới
5. Copy API key được tạo

## Bước 2: Thêm API Key vào file .env

Mở file `.env` ở thư mục gốc của project và thêm dòng sau:

```
GEMINI_API_KEY=your_api_key_here
```

Thay `your_api_key_here` bằng API key bạn đã copy ở bước 1.

**Ví dụ:**
```
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Bước 3: Khởi động lại server

Sau khi thêm API key, khởi động lại server:

```bash
npm start
```

Hoặc nếu đang chạy với nodemon:

```bash
npm run dev
```

## Kiểm tra

Khi server khởi động, bạn sẽ thấy một trong hai thông báo:

- ✅ **Thành công**: `✅ Gemini AI initialized successfully`
- ⚠️ **Chưa cấu hình**: `⚠️ GEMINI_API_KEY not found in .env file. Gemini AI will not be available.`

Nếu thấy thông báo thành công, chatbot đã sẵn sàng sử dụng Gemini AI!

## Lưu ý

- API key của Gemini AI là **miễn phí** với giới hạn nhất định
- Không chia sẻ API key công khai
- Nếu không có API key, chatbot vẫn hoạt động bình thường nhưng sẽ không sử dụng Gemini AI cho các câu hỏi về web/phim
