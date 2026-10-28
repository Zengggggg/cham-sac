# Deploy backend lên Render

Repository đã có Blueprint ở `render.yaml`. Blueprint tạo một Node.js Web Service với:

- thư mục chạy: `backend/`;
- region: Singapore;
- build: `npm ci --omit=dev`;
- start: `npm start`;
- health check: `GET /chamsacviet/status`;
- Node.js `22.22.0`;
- gói mặc định: `free`.

Không thêm `PORT` trên Render. Render tự cấp biến này và `src/server.js` đã đọc `process.env.PORT`.

## 1. Chuẩn bị MongoDB Atlas

Backend dùng MongoDB transaction khi checkout, xử lý webhook và hoàn tồn, vì vậy database phải chạy dưới dạng replica set. MongoDB Atlas đáp ứng yêu cầu này.

1. Tạo cluster Atlas ở region Singapore nếu có thể.
2. Tạo database user riêng cho ứng dụng.
3. Cho lần deploy đầu, có thể tạm cho phép `0.0.0.0/0` trong **Network Access** với database user và mật khẩu mạnh. Ngay sau khi service được tạo, xem các dải IP tại **Render > Service > Connect > Outbound**, thêm chúng vào Atlas rồi xóa rule `0.0.0.0/0`.
4. Lấy connection string dạng `mongodb+srv://...` và URL-encode ký tự đặc biệt trong username/password.
5. Chạy migration một lần từ máy local với URI Atlas:

```powershell
cd backend
$env:MONGODB_URI = "mongodb+srv://<user>:<password>@<cluster>/cham_sac_viet"
$env:MONGODB_DB_NAME = "cham_sac_viet"
npm run db:migrate:shop
Remove-Item Env:MONGODB_URI
Remove-Item Env:MONGODB_DB_NAME
```

Không ghi URI thật vào `.env.example`, `render.yaml` hoặc commit Git.

## 2. Tạo Blueprint trên Render

1. Push repository lên GitHub/GitLab.
2. Mở Render Dashboard, chọn **New > Blueprint**.
3. Kết nối repository và chọn branch cần deploy.
4. Render sẽ đọc file `render.yaml` ở root repository.
5. Nhập các biến có `sync: false` khi Render yêu cầu.
6. Chọn **Apply** và đợi deploy hoàn tất.

Các biến cần nhập:

| Biến | Giá trị |
| --- | --- |
| `MONGODB_URI` | Connection string MongoDB Atlas |
| `FRONTEND_URL` | Origin frontend, ví dụ `https://cham-sac-viet.vercel.app` (không có path) |
| `GOOGLE_CLIENT_ID` | OAuth Web Client ID; nếu chưa dùng Google login có thể thêm sau trong Dashboard |
| `RESEND_API_KEY` | API key Resend |
| `RESEND_FROM_EMAIL` | Email thuộc domain đã xác minh trên Resend |
| `PAYOS_CLIENT_ID` | Client ID của kênh thanh toán payOS |
| `PAYOS_API_KEY` | API key của kênh thanh toán payOS |
| `PAYOS_CHECKSUM_KEY` | Checksum key của kênh thanh toán payOS |
| `PAYOS_RETURN_URL` | URL frontend sau thanh toán, ví dụ `https://cham-sac-viet.vercel.app/payment/success` |
| `PAYOS_CANCEL_URL` | URL frontend khi hủy, ví dụ `https://cham-sac-viet.vercel.app/payment/cancel` |
| `R2_ACCOUNT_ID` | Cloudflare Account ID chứa bucket ảnh sản phẩm |
| `R2_ACCESS_KEY_ID` | Access Key ID của R2 có quyền ghi vào bucket |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key tương ứng, chỉ lưu trên Render |
| `R2_BUCKET_NAME` | Tên bucket lưu ảnh sản phẩm |
| `R2_PUBLIC_BASE_URL` | Custom/public domain HTTPS của bucket, ví dụ `https://assets.chamsacviet.io.vn` |

`JWT_SECRET` và `REFRESH_TOKEN_SECRET` được Render sinh tự động, độc lập, chỉ trong lần tạo Blueprint đầu tiên.

## 3. Kiểm tra sau deploy

Giả sử Render cấp URL `https://cham-sac-viet-api.onrender.com`, kiểm tra:

```text
https://cham-sac-viet-api.onrender.com/chamsacviet/status
https://cham-sac-viet-api.onrender.com/api-docs
```

Health endpoint phải trả HTTP 200. Nếu deploy lỗi, xem tab **Logs**; các lỗi thường gặp là Atlas chưa cho phép outbound IP, thiếu biến Resend hoặc hai JWT secret không hợp lệ.

## 4. Đăng ký webhook payOS

Sau khi backend có URL HTTPS công khai, webhook chính xác là:

```text
https://<render-service>.onrender.com/chamsacviet/payments/payos/webhook
```

1. Thêm biến `PAYOS_WEBHOOK_URL` trong **Render > Service > Environment** với URL trên.
2. Đăng ký hoặc cập nhật URL này cho đúng kênh thanh toán trên payOS.
3. Kiểm tra log Render khi payOS gửi payload xác nhận.

Backend chỉ đổi trạng thái payment sang `success` từ webhook payOS có chữ ký hợp lệ; `returnUrl` không được dùng để xác nhận thanh toán.

## 5. Nối frontend production

Trong môi trường deploy của frontend, đặt:

```dotenv
VITE_API_URL=https://<render-service>.onrender.com
VITE_GOOGLE_CLIENT_ID=<same-google-client-id>
```

Sau đó build/deploy lại frontend. Nếu domain frontend thay đổi, cập nhật `FRONTEND_URL` trên Render rồi redeploy backend để CORS cho phép origin mới.

Các biến `R2_*` được khai báo `sync: false` trong Blueprint. Nhập giá trị thật trong Render Dashboard trước khi dùng chức năng tạo sản phẩm có ảnh; sau khi cập nhật biến môi trường, redeploy backend.

## 6. Lưu ý về gói Free và hoàn tồn kho

Render Free cho web service ngủ sau thời gian không có request. Khi service ngủ, worker quét đơn hết hạn cũng dừng. Vì vậy mốc `ORDER_PAYMENT_EXPIRES_MINUTES=15` vẫn được lưu trong database, nhưng việc hủy đơn và hoàn tồn chỉ chạy ở lần service thức dậy tiếp theo, rồi tối đa thêm khoảng `ORDER_EXPIRY_INTERVAL_SECONDS=60` giây.

Với website bán hàng thật, đổi trong `render.yaml`:

```yaml
plan: starter
```

Gói chạy liên tục giúp webhook payOS và worker hoàn tồn hoạt động đúng thời gian hơn. Không lưu ảnh hay dữ liệu lâu dài trên filesystem của Render; ứng dụng hiện đã dùng Atlas và R2 cho dữ liệu cần lưu bền.
