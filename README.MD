# Hướng dẫn chạy dự án poi-map

## Yêu cầu hệ thống
- Node.js (đề xuất từ 18.x trở lên)
- npm đi kèm với bộ cài Node.js

## Cài đặt phụ thuộc
1. Mở terminal tại thư mục dự án `24127378`.
2. Chạy lệnh `npm install` để cài đặt các package cần thiết.

## Chạy ở chế độ phát triển
1. Sau khi cài đặt xong, chạy `npm run dev`.
2. Vite sẽ hiển thị địa chỉ truy cập, thường là `http://localhost:5173`.
3. Mở trình duyệt và truy cập địa chỉ trên để xem ứng dụng.

> Ứng dụng yêu cầu đăng nhập bằng Firebase Authentication. Nếu chưa cấu hình, xem mục "Cấu hình Firebase" bên dưới.

## Build và chạy bản dựng
1. Tạo bản dựng sản xuất bằng `npm run build`.
2. Kiểm tra bản dựng bằng `npm run preview`.
3. Truy cập đường dẫn mà Vite cung cấp để xem bản dựng.

## Ghi chú
- Dự án sử dụng React kết hợp Leaflet thông qua Vite. Đảm bảo kết nối Internet khi phát triển để tải bản đồ nếu cần.

## Cấu hình Firebase
1. Tạo dự án trên [Firebase Console](https://console.firebase.google.com/) và bật Email/Password Authentication.
2. Lấy thông tin cấu hình Web App (`apiKey`, `authDomain`, `projectId`, ...).
3. Tại thư mục gốc, tạo file `.env` (hoặc `.env.local`) với nội dung:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Khởi động lại server Vite sau khi thêm biến môi trường.