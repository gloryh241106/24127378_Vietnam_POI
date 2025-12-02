# Vietnam Points of Interest – Hướng dẫn triển khai

> Ứng dụng React + Leaflet giúp tra cứu địa điểm tại Việt Nam, có kèm dịch tiếng Anh → tiếng Việt thông qua backend FastAPI proxy tới HuggingFace.

## Yêu cầu hệ thống

- Node.js >= 18 và npm đi kèm.
- Python >= 3.10.
- Tài khoản Firebase với cấu hình Authentication.
- Tài khoản HuggingFace để tạo `HF_API_TOKEN`.
- Tài khoản ngrok (hoặc dịch vụ tunnel tương tự).

## Biến môi trường

Có **một** file `.env` duy nhất ở thư mục gốc. Các biến `VITE_*` được expose cho frontend, các biến còn lại chỉ backend đọc.

| Biến | Ý nghĩa |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, ... | Thông tin Firebase project. |
| `VITE_TRANSLATION_API_BASE_URL` | URL HTTPS do ngrok cung cấp, ví dụ `https://abc123.ngrok-free.app`. |
| `HF_API_TOKEN` | HuggingFace Access Token (bắt buộc). |
| `HF_TRANSLATION_MODEL` | Model dịch, mặc định `Helsinki-NLP/opus-mt-en-vi`. |
| `HF_ROUTER_BASE_URL` | Router HuggingFace, mặc định `https://router.huggingface.co/hf-inference/models`. |

Ví dụ `.env` tối thiểu:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_TRANSLATION_API_BASE_URL="https://<ten-duong-ham>.ngrok-free.app"

HF_API_TOKEN=hf_xxxxxx
HF_TRANSLATION_MODEL=Helsinki-NLP/opus-mt-en-vi
HF_ROUTER_BASE_URL=https://router.huggingface.co/hf-inference/models
```

## Chuẩn bị & cài đặt

1. Clone dự án hoặc tải mã nguồn về máy.
2. Tạo file `.env` theo mẫu phía trên.
3. Cài đặt phụ thuộc frontend:
   ```powershell
   npm install
   ```
4. Cài đặt phụ thuộc backend:
   ```powershell
   pip install -r requirements.txt
   ```

## Chạy backend FastAPI

```powershell
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 --env-file .env
```

- Giữ terminal này mở trong suốt quá trình sử dụng.
- Có thể kiểm tra tình trạng bằng `http://localhost:8000/health`.

## Tạo đường hầm công khai (ngrok)

Ngrok giúp frontend đang chạy localhost truy cập được backend. Cài và đăng nhập một lần, sau đó dùng:

```
ngrok http 8000
```

### Cài đặt ngrok theo hệ điều hành

- **Windows**
  1. Tải ZIP từ <https://ngrok.com/download>.
  2. Giải nén `ngrok.exe` vào thư mục thuộc PATH (ví dụ `C:\ngrok`).
  3. Đăng nhập: `ngrok config add-authtoken <token>`.
  4. Tạo tunnel: `ngrok http 8000`.

- **macOS**
  1. `brew install ngrok/ngrok/ngrok` **hoặc** tải `.tgz` và copy vào `/usr/local/bin`.
  2. `ngrok config add-authtoken <token>`.
  3. `ngrok http 8000`.

- **Linux**
  1. Tải `.tgz` phù hợp distro hoặc `sudo snap install ngrok`.
  2. Copy binary vào `/usr/local/bin/ngrok`.
  3. `ngrok config add-authtoken <token>`.
  4. `ngrok http 8000`.

> Mỗi máy hoặc mỗi lần chạy sẽ sinh URL khác nhau trong dòng `Forwarding`. Sau khi có URL mới, cập nhật `VITE_TRANSLATION_API_BASE_URL` và khởi động lại `npm run dev`.

## Chạy frontend Vite

```powershell
npm run dev
```

- Mặc định Vite mở `http://localhost:5173`.
- Đăng nhập Firebase, nhập địa điểm cần tra cứu, mở popup “Translate EN > VI” để kiểm tra backend.

## Kiểm thử nhanh

1. **Health check backend**
   ```powershell
   curl http://localhost:8000/health
   ```
2. **Thử dịch trực tiếp qua API**
   ```powershell
   curl -X POST http://localhost:8000/translate ^
     -H "Content-Type: application/json" ^
     -d "{\"text\":\"Help me\"}"
   ```
3. **Trên giao diện**: mở popup dịch, nhập “Help me”. Kết quả mong đợi là “Hãy giúp tôi”. Nếu ra chuỗi vô nghĩa, hãy restart backend và kiểm tra lại `.env`.

## Build & triển khai sản phẩm

```powershell
npm run build     # tạo bản dựng production
npm run preview   # kiểm tra bản dựng tại http://localhost:4173
```

Trước khi build để deploy, bảo đảm `VITE_TRANSLATION_API_BASE_URL` trỏ tới một backend cố định (ví dụ VPS), không phải URL ngrok tạm thời.

## Troubleshooting

| Triệu chứng | Cách xử lý |
| --- | --- |
| `HF_API_TOKEN is not configured on the server` | Kiểm tra `.env` có trường `HF_API_TOKEN`, và lệnh uvicorn có `--env-file .env`. |
| Dịch ra “GenericName ảo...” | Backend chưa restart sau khi cập nhật code/`.env`. Dừng uvicorn, chạy lại, đảm bảo ngrok vẫn hoạt động. |
| Frontend báo lỗi fetch | `VITE_TRANSLATION_API_BASE_URL` chưa đúng hoặc ngrok đã tắt. Mở tunnel mới và cập nhật `.env`. |
| `ngrok` không nhận lệnh | Chưa thêm vào PATH hoặc chưa `add-authtoken`. Kiểm tra lại bước cài đặt theo hệ điều hành. |
| Lỗi CORS | Backend đã bật CORS. Nếu vẫn lỗi, kiểm tra trình duyệt có block do HTTPS tự ký hay không. |

## Câu hỏi thường gặp

**Có thể dùng pinggy/localtunnel thay ngrok không?**  
Được, miễn là cung cấp URL HTTPS công khai. Tuy nhiên ngrok ổn định hơn, có log tiện theo dõi.

**Có bắt buộc dùng chung một `.env`?**  
Không. Có thể tách `.env.frontend` và `.env.backend` nhưng phải cấu hình lại Vite/uvicorn tương ứng. README chọn cách dùng chung để giảm sai sót.

**Nếu gửi `.env` cho người khác thì sao?**  
Ai có `.env` chứa `HF_API_TOKEN` đều có thể sử dụng quota HuggingFace của bạn. Không nên chia sẻ, hoặc hãy thu hồi token sau khi lỡ gửi.

## Ghi chú bảo mật

- Thu hồi (`revoke`) và tạo mới `HF_API_TOKEN` ngay nếu nghi ngờ bị lộ.
- Giới hạn domain hợp lệ ở Firebase console để tránh bị lợi dụng API key.
- Chỉ mở đường hầm khi cần. Đóng cả uvicorn lẫn ngrok khi dừng làm việc để hạn chế rủi ro.

---

## Yêu cầu hệ thống
- Node.js (đề xuất từ 18.x trở lên)
- npm đi kèm với bộ cài Node.js
- Python 3.10 trở lên (để chạy backend FastAPI)

## Cài đặt phụ thuộc
1. Mở terminal tại thư mục dự án `24127378_Vietnam_POI`.
2. Thêm file `.env` vào thư mục dự án (xem chi tiết bên dưới, vì hiện tại frontend và backend cùng dùng chung một `.env`).
3. Chạy `npm install` để cài đặt package cho frontend.
4. Cài phụ thuộc Python cho backend bằng `pip install -r requirements.txt`.

## Chạy ở chế độ phát triển
1. Sau khi cài đặt xong, chạy `npm run dev`.
2. Vite sẽ hiển thị địa chỉ truy cập, thường là `http://localhost:5173`.
3. Mở trình duyệt và truy cập địa chỉ trên để xem ứng dụng.

## Build và chạy bản dựng
1. Tạo bản dựng sản xuất bằng `npm run build`.
2. Kiểm tra bản dựng bằng `npm run preview`.
3. Truy cập đường dẫn mà Vite cung cấp để xem bản dựng.

## Ghi chú
- Dự án sử dụng React kết hợp Leaflet thông qua Vite. Đảm bảo kết nối Internet khi phát triển để tải bản đồ nếu cần.

## Quy trình chạy tổng thể

> Tóm tắt nhanh cho lần chạy đầu tiên: chuẩn bị `.env` → cài frontend/backend deps → chạy backend → mở ngrok → cập nhật `VITE_TRANSLATION_API_BASE_URL` → chạy frontend.

1. **Chuẩn bị `.env` duy nhất ở thư mục gốc**
	- Sao chép nội dung mẫu ở mục "Dịch thuật bằng FastAPI" bên dưới vào file `.env` mới.
	- Điền chính xác thông tin Firebase (`VITE_FIREBASE_*`).
	- Sinh token HuggingFace tại trang Access Tokens và gán vào `HF_API_TOKEN`.
	- Để trống hoặc giữ mặc định `HF_TRANSLATION_MODEL` và `HF_ROUTER_BASE_URL` nếu bạn vẫn dùng mô hình Helsinki.
2. **Cài đặt phụ thuộc**
	- Frontend: `npm install`
	- Backend: `pip install -r requirements.txt`
3. **Chạy backend FastAPI**
	```powershell
	python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 --env-file .env
	```
	Giữ nguyên terminal này để server hoạt động. Có thể truy cập `http://localhost:8000/health` trong trình duyệt hoặc `curl http://localhost:8000/health` để kiểm tra.
4. **Tạo đường hầm (ngrok)**
	- Nếu chưa cài, xem phần "Hướng dẫn cài ngrok theo hệ điều hành".
	- Sau khi chạy `ngrok http 8000`, lấy đường dẫn HTTPS ở dòng `Forwarding`, ví dụ `https://abc123.ngrok-free.app`.
5. **Cập nhật `.env` với URL mới**
	- Mở `.env` và cập nhật `VITE_TRANSLATION_API_BASE_URL="https://abc123.ngrok-free.app"`.
	- Mỗi lần ngrok sinh URL mới, lặp lại bước này.
6. **Chạy frontend Vite**
	```powershell
	npm run dev
	```
	Mở trình duyệt đến URL Vite trả về (mặc định `http://localhost:5173`). Đăng nhập Firebase, nhập địa điểm và thử popup dịch.
7. **Kiểm tra nhanh chức năng dịch**
	- Thử câu "Help me". Nếu backend hoạt động đúng, bạn sẽ nhận được câu tiếng Việt hợp lý (ví dụ "Hãy giúp tôi"). Nếu thấy chuỗi lặp vô nghĩa, hãy đảm bảo backend đã restart sau khi cập nhật mã nguồn `.py` và `.env`.

Sau khi hiểu quy trình, lần chạy tiếp theo chỉ cần lặp lại các bước 3→6 (cài đặt phụ thuộc lại chỉ cần thiết khi thay đổi package).

### Hướng dẫn cài ngrok theo hệ điều hành

Ngrok chỉ cần cài một lần trên máy. Sau khi cài, đăng nhập tài khoản và chạy `ngrok http 8000` để tạo đường hầm. Mỗi phiên bản ngrok trên máy khác nhau sẽ sinh ra một URL khác nhau, vì thế hãy kiểm tra kỹ "Forwarding" trong output và cập nhật lại `VITE_TRANSLATION_API_BASE_URL` tương ứng.

- **Windows**
	1. Tải file ZIP từ https://ngrok.com/download (chọn Windows).
	2. Giải nén `ngrok.exe` vào một thư mục nằm trong PATH (ví dụ `C:\ngrok`) hoặc cùng thư mục dự án.
	3. Chạy `ngrok config add-authtoken <token>` để lưu token.
	4. Tạo đường hầm: `ngrok http 8000`.

- **macOS**
	1. Nếu dùng Homebrew: `brew install ngrok/ngrok/ngrok`. Hoặc tải `.tgz` từ trang download rồi giải nén đặt vào `/usr/local/bin`.
	2. Chạy `ngrok config add-authtoken <token>`.
	3. Tạo đường hầm: `ngrok http 8000`.

- **Linux**
	1. Tải `.tgz` từ https://ngrok.com/download (chọn distro tương ứng) hoặc `sudo snap install ngrok` nếu dùng Snap.
	2. Giải nén nhị phân vào đường dẫn nằm trong PATH, ví dụ `/usr/local/bin/ngrok`.
	3. Chạy `ngrok config add-authtoken <token>`.
	4. Tạo đường hầm: `ngrok http 8000`.

Khi chạy trên Windows, macOS hay Linux, URL xuất hiện trong dòng `Forwarding` sẽ khác nhau cho mỗi máy. Vì vậy, sau mỗi lần mở đường hầm trên từng hệ điều hành, hãy copy chính xác URL HTTPS được tạo ra và gán vào `VITE_TRANSLATION_API_BASE_URL`, rồi khởi động lại `npm run dev` để frontend gọi đúng backend.

## Dịch thuật bằng FastAPI

Frontend không gọi HuggingFace trực tiếp nữa mà sẽ gọi một API trung gian được xây dựng bằng FastAPI tại thư mục `backend/`. Từ nay dự án chỉ dùng một file `.env` duy nhất ở thư mục gốc để cấu hình cho cả frontend (các biến bắt đầu bằng `VITE_`) và backend (các biến `HF_*`). Ví dụ tối thiểu:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_TRANSLATION_API_BASE_URL="https://<ten-duong-ham>.ngrok-free.app"

HF_API_TOKEN=hf_xxxxxx
HF_TRANSLATION_MODEL=Helsinki-NLP/opus-mt-en-vi
HF_ROUTER_BASE_URL=https://router.huggingface.co/hf-inference/models
```

Các bước chạy backend + frontend:

1. Cài phụ thuộc Python (nếu chưa):
	```powershell
	pip install -r requirements.txt
	```
2. Khởi động backend FastAPI và đọc chung `.env` ở thư mục gốc:
	```powershell
	python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 --env-file .env
	```
3. Tạo đường hầm công khai để frontend có thể gọi backend:
	- **ngrok** (khuyên dùng): `ngrok http 8000`
	- hoặc dịch vụ tương tự (localtunnel, pinggy...).
4. Sao chép URL HTTPS do đường hầm cung cấp (ví dụ `https://abc123.ngrok-free.app`) và điền vào biến `VITE_TRANSLATION_API_BASE_URL` trong `.env`, sau đó khởi động hoặc restart Vite (`npm run dev`) để áp dụng.
5. Chạy frontend:
	```powershell
	npm run dev
	```
6. Mở trình duyệt → URL do Vite cung cấp (mặc định `http://localhost:5173`), đăng nhập Firebase rồi thử chức năng dịch. Khi backend hoạt động đúng, câu "Help me" sẽ ra tiếng Việt chính xác thay vì chuỗi vô nghĩa.

