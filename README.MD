# Hướng dẫn chạy dự án poi-map

## Yêu cầu hệ thống
- Node.js (đề xuất từ 18.x trở lên)
- npm đi kèm với bộ cài Node.js

## Cài đặt phụ thuộc
1. Mở terminal tại thư mục dự án `24127378_Vietnam_POI`.
2. Thêm file `.env` được gửi vào trong thư mục dự án.
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