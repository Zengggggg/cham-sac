# Chạm Sắc Việt Backend

Backend Node.js/Express dùng MongoDB/Mongoose. Toàn bộ API được mount dưới prefix `/chamsacviet`.

## Swagger API

Sau khi khởi động backend, mở giao diện Swagger tại:

```text
http://localhost:8080/api-docs
```

OpenAPI JSON có tại `http://localhost:8080/api-docs.json`. Với endpoint cần đăng nhập, bấm **Authorize** và nhập access token nhận được từ API login; Swagger tự thêm tiền tố `Bearer`.

## Quy chuẩn response BE → FE

Mọi JSON response public phải được tạo qua `sendSuccess` hoặc `sendError` trong `src/utils/apiResponse.js` và luôn có đủ sáu field:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy dữ liệu thành công.",
  "data": {},
  "meta": null,
  "errors": null
}
```

- `statusCode` trong body phải bằng HTTP status thực tế.
- `data` là object/array khi thành công và là `null` khi không có payload hoặc khi lỗi.
- `meta` mặc định `null`; API phân trang dùng `{ "currentPage", "limit", "totalItems", "totalPages" }`.
- `errors` mặc định `null`; validation error dùng mảng `{ "field", "message" }`.
- Không trả stack trace hoặc chi tiết hạ tầng ở production. Chi tiết dev vẫn phải nằm trong mảng `errors`.

Ví dụ validation error:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Dữ liệu không hợp lệ.",
  "data": null,
  "meta": null,
  "errors": [
    {
      "field": "email",
      "message": "Email không hợp lệ."
    }
  ]
}
```

Ví dụ response phân trang:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách sản phẩm thành công.",
  "data": [],
  "meta": {
    "currentPage": 1,
    "limit": 10,
    "totalItems": 50,
    "totalPages": 5
  },
  "errors": null
}
```

## Chạy local

Yêu cầu Node.js 20.19+.

```bash
npm ci
copy .env.example .env
npm run dev
```

Các biến bắt buộc:

- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: secret access token, tối thiểu 32 ký tự.
- `REFRESH_TOKEN_SECRET`: secret refresh token khác access token, tối thiểu 32 ký tự.
- `RESEND_API_KEY`: API key dùng để gửi email OTP qua Resend.
- `RESEND_FROM_EMAIL`: địa chỉ gửi thuộc domain đã xác minh trên Resend.

`GOOGLE_CLIENT_ID` là bắt buộc khi bật đăng nhập Google. `MONGODB_DB_NAME` mặc định là `cham_sac_viet`. Xem toàn bộ cấu hình trong `.env.example`.

## Khởi tạo MongoDB

Backend có 7 collections theo `mongodb_database_spec.md`: `users`, `products`, `heritage_sites`, `orders`, `ar_models`, `game_rules`, `payments`. Order items được snapshot và nhúng trực tiếp trong `orders`.

Sau khi cấu hình `MONGODB_URI` và `MONGODB_DB_NAME`, chạy:

```bash
npm run db:init
```

Script có thể chạy lặp lại: collection mới sẽ được tạo; collection có sẵn được cập nhật JSON Schema validator bằng `collMod`; index được tạo theo tên cố định. Nếu dữ liệu hiện có vi phạm unique index, script dừng và báo rõ index lỗi để tránh âm thầm làm mất dữ liệu.

Seed development tối thiểu:

```bash
npm run db:seed
```

Trước khi seed, điền `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD` và tùy chọn `DEV_ADMIN_NAME`. Script từ chối chạy khi `NODE_ENV=production` và không chứa mật khẩu mặc định trong source code.

## payOS

Backend sử dụng SDK Node chính thức `@payos/node`. Cấu hình các biến `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL`; `PAYOS_WEBHOOK_URL` dùng khi đăng ký webhook công khai.

Lớp tích hợp tại `src/providers/payOSProvider.js` hỗ trợ tạo payment link, xác minh chữ ký webhook và xác nhận webhook URL. Models lưu `providerOrderCode` để ánh xạ số đơn của payOS, `paymentLinkId` để tra cứu link và `providerTransactionId` để xử lý webhook idempotent.

Checkout API và webhook route chưa được mount vì nghiệp vụ phí ship và thời điểm trừ tồn kho vẫn cần được chốt. Không cập nhật trạng thái thanh toán từ `returnUrl`; trạng thái phải được xác nhận từ webhook đã qua `payOS.webhooks.verify()`.

Trước khi thử đăng ký, tạo API key trên Resend, xác minh domain gửi và điền `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. Backend không log hoặc trả OTP trong API response.

## Auth API

Public registration luôn tạo role `user`; client không được phép tự chọn role. Role hợp lệ trong hệ thống là `user` và `admin`.

| Method | Endpoint | Auth | Mục đích |
| --- | --- | --- | --- |
| `POST` | `/chamsacviet/auth/register` | Public | Tạo tài khoản chờ xác minh và gửi OTP qua email |
| `POST` | `/chamsacviet/auth/verify-email` | Public | Xác minh `email`, `otp`, kích hoạt tài khoản và nhận JWT |
| `POST` | `/chamsacviet/auth/resend-verification-otp` | Public | Gửi lại OTP bằng `email` |
| `POST` | `/chamsacviet/auth/login` | Public | Đăng nhập bằng `email`, `password` |
| `POST` | `/chamsacviet/auth/google` | Public | Đăng nhập/đăng ký bằng Google `idToken` |
| `POST` | `/chamsacviet/auth/google/link` | Bearer access token | Liên kết Google vào tài khoản hiện tại |
| `POST` | `/chamsacviet/auth/refresh-token` | Public | Xoay access/refresh token bằng `refreshToken` |
| `POST` | `/chamsacviet/auth/logout` | Public | Thu hồi đúng `refreshToken` hiện tại |
| `GET` | `/chamsacviet/auth/me` | Bearer access token | Lấy người dùng đang đăng nhập |

Ví dụ đăng ký:

```json
{
  "name": "Nguyễn An",
  "email": "an@example.com",
  "password": "matkhau123"
}
```

Đăng ký thành công chưa cấp JWT. Người dùng lấy OTP 6 số từ email rồi xác minh:

```json
{
  "email": "an@example.com",
  "otp": "123456"
}
```

OTP mặc định hết hạn sau 10 phút, tối đa 5 lần nhập sai và phải chờ 60 giây trước khi yêu cầu gửi lại. Các giới hạn này cấu hình bằng biến môi trường. Đăng nhập email/mật khẩu bị từ chối cho đến khi xác minh thành công. Tài khoản Google được xem là đã xác minh vì backend kiểm tra `email_verified` từ Google.

Route cần bảo vệ dùng `authenticate`; route admin ghép thêm `authorizeRoles('admin')`. Access token gửi qua header `Authorization: Bearer <token>`.

Frontend dùng Google Identity Services với cùng `GOOGLE_CLIENT_ID`, lấy `response.credential` rồi gửi:

```json
{
  "idToken": "<response.credential>"
}
```

Backend xác minh chữ ký, issuer, expiry và audience bằng thư viện chính thức của Google. Nếu email đã thuộc tài khoản mật khẩu, API Google login trả `409`; người dùng phải đăng nhập bằng mật khẩu rồi gọi `/auth/google/link` để tránh tự động liên kết nhầm tài khoản.

## Kiểm tra

```bash
npm run lint
npm test
npm audit
```

## Postman

Import hai file sau và chọn environment `Chạm Sắc Việt - Local`:

- `postman/Cham-Sac-Viet-Auth.postman_collection.json`
- `postman/Local.postman_environment.json`

Điền `testEmail` bằng địa chỉ email thật có thể nhận thư và điền `emailOtp` sau khi nhận mã. Chạy lần lượt Register, Verify Email rồi các request còn lại trong folder `Email & Password Flow`. Collection tự lưu access/refresh token từ response xác minh.

Để test Google, điền `googleIdToken` bằng Google ID token JWT còn hạn (không phải access token). Backend cũng phải có `GOOGLE_CLIENT_ID` trùng với audience của token.
