# Deploy frontend lên Vercel

## 1. Tạo project

1. Import repository vào Vercel.
2. Trong **Build and Deployment > Root Directory**, chọn `frontend`.
3. Chọn **Framework Preset: Vite**.
4. Giữ các giá trị đã khai báo trong `frontend/vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `dist`

`vercel.json` đã có SPA rewrite về `index.html`, vì vậy mở trực tiếp hoặc tải lại các route như `/ar`, `/login` và `/admin` sẽ không bị 404.

## 2. Biến môi trường Vercel

Thêm trong **Project Settings > Environment Variables** cho Production và Preview nếu cần:

```dotenv
VITE_API_URL=https://your-backend.example.com
VITE_GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

`VITE_API_URL` chỉ chứa origin backend, không thêm `/chamsacviet` và không để dấu `/` cuối. Bỏ qua `VITE_GOOGLE_CLIENT_ID` nếu chưa bật Google Login. Sau khi đổi biến môi trường phải redeploy vì Vite nhúng các biến `VITE_*` trong lúc build.

Không đưa secret backend, MongoDB, JWT, Resend, payOS hoặc R2 vào Vercel frontend. Mọi biến `VITE_*` đều có thể đọc được trong trình duyệt.

## 3. Đồng bộ backend và dịch vụ ngoài

- Đặt `FRONTEND_URL=https://<production-domain-vercel>` trên backend rồi redeploy backend để CORS chấp nhận frontend.
- Nếu dùng Preview Deployment, backend hiện chỉ cho phép một `FRONTEND_URL`; preview domain sẽ không gọi API được cho đến khi được allowlist.
- Thêm origin Vercel production vào OAuth 2.0 **Authorized JavaScript origins** nếu dùng Google Login.
- CDN chứa `.glb` và ảnh phải trả CORS cho origin Vercel. Với asset công khai không dùng cookie, có thể cho phép `Access-Control-Allow-Origin: *`.
- Cập nhật `PAYOS_RETURN_URL` và `PAYOS_CANCEL_URL` sang domain Vercel nếu bật thanh toán.

## 4. Kiểm tra sau deploy

1. Mở trang chủ và tải lại trực tiếp `/ar` để kiểm tra SPA rewrite.
2. Mở DevTools > Network, xác nhận `/chamsacviet/ar/experiences` gọi đúng backend và không có lỗi CORS.
3. Trên điện thoại, mở `/ar` bằng HTTPS, cấp quyền camera và quét thẻ Hồ Gươm.
4. Xác nhận model Tháp Rùa tải thành công và không có lỗi CORS từ `assets.chamsacviet.io.vn`.
5. Kiểm tra đăng nhập Google và URL trở về sau thanh toán nếu các tính năng này được bật.
