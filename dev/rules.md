# 🚀 Hướng Dẫn & Tiêu Chuẩn Code Dự Án (Rule Dev)

## 🛠️ 1. Hướng Dẫn Chạy Dự Án (Local Development)

Dự án được chia làm 2 phần độc lập: **Frontend** (React/Vite) và **Backend** (Node.js/Express).

### ⚙️ Backend

1. Di chuyển vào thư mục backend: `cd backend`
2. Cài đặt các gói phụ thuộc: `npm install` (hoặc `yarn install`)
3. Tạo file biến môi trường: Copy file `.env.example` thành `.env` và điền đầy đủ các thông số (Database, JWT, Port...).
4. Khởi động server dev: `npm run dev`
   _(Server sẽ chạy bằng nodemon, tự động reload khi bạn sửa code)._

### 🎨 Frontend

1. Di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt các gói phụ thuộc: `npm install`
3. Tạo file biến môi trường: Copy `.env` (nhớ trỏ `VITE_BACKEND_URL` về đúng port của backend ở trên).
4. Khởi động giao diện: `npm run dev`
   _(Vite sẽ khởi chạy cực nhanh, mở link localhost trên terminal để xem)._

---

## 🧼 2. Tiêu Chuẩn Clean Code (Code Quality)

### Tư duy cốt lõi

- **Ít code = Ít nợ kỹ thuật (Debt):** Hoàn thành tính năng với số lượng code thay đổi ít nhất có thể.
- Đơn giản và chạy được > Thông minh nhưng dễ vỡ.
- Nếu không chắc chắn: Hãy đọc code cũ của dự án và code theo đúng style đó.

### Đặt tên (Naming)

- Dùng tên mang tính mô tả rõ ràng. Đọc tên biến là hiểu nó làm gì, không cần comment giải thích.
- **Hàm xử lý sự kiện (Events):** Bắt đầu bằng `handle` (VD: `handleSubmit`, `handleWalletChange`).
- **Biến Boolean:** Bắt đầu bằng `is/has/can` (VD: `isLoading`, `hasError`, `canWithdraw`).
- **Hàm Bất đồng bộ (Async):** Dùng động từ mô tả hành động (VD: `fetchWallets`, `createTransaction`).

### Kiểm soát luồng (Control Flow)

- **Ưu tiên Early Return:** Tránh if-else lồng nhau quá sâu. Check lỗi và `return` ngay ở đầu hàm.
  ```js
  // ✅ Chuẩn
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!wallet) return res.status(404).json({ message: "Wallet not found" });
  // ... xử lý logic chính
  ```

### Quy tắc cấm kỵ (Forbidden)

- ❌ Không để lọt `console.log` lên production (debug xong nhớ xóa).
- ❌ Không hardcode (cứng) URL, mật khẩu, API keys trong code — phải dùng file `.env`.
- ❌ Không dùng comment để giải thích những đoạn code đã quá rõ ràng. Nếu logic phức tạp mới cần comment (và comment bằng tiếng Anh).
- ❌ Không để lại các đoạn code bị comment (commented-out code). Cứ xóa đi, Git đã lưu lịch sử rồi.

---

## ⚙️ 3. Tiêu Chuẩn Backend (Node.js / Express)

- **Mô hình MVC Chuẩn:**
  - `Controller`: Chỉ nhận Request và trả về Response. Không chứa logic nghiệp vụ.
  - `Model`: Chỉ chứa câu lệnh SQL/Truy vấn DB. Tuyệt đối không dính dáng đến HTTP (req/res).
  - `Router`: Chỉ định nghĩa đường dẫn và gắn middleware.
- **Bảo mật dữ liệu (Quy tắc sống còn):** Mọi truy vấn liên quan đến dữ liệu người dùng **BẮT BUỘC** phải có filter `user_id`. Không bao giờ được lấy toàn bộ dữ liệu của hệ thống ra.
- **Chống SQL Injection:** Luôn dùng **Parameterized Queries** (`?`), tuyệt đối không nối chuỗi thẳng vào câu query.
- **Xử lý lỗi:** Wrap mọi thao tác async vào khối `try/catch` và đẩy lỗi về middleware xử lý lỗi tổng bằng `next(err)`.
- **Xác thực (Auth):** `req.body` là không đáng tin cậy. Nếu cần lấy ID của user đang đăng nhập, **phải** lấy từ token qua `req.user.id`.

---

## 🎨 4. Tiêu Chuẩn Frontend (React / Vite / Tailwind)

### Thiết kế Component

- Một component = Một trách nhiệm duy nhất.
- Giữ độ dài component **dưới 150 dòng**. Dài hơn thì bóc tách thành component con hoặc custom hook.
- Truyền ít props nhất có thể (< 5 props). Nếu nhiều hơn, hãy cân nhắc dùng Context hoặc Zustand.

### Quản lý trạng thái (State)

- **State dùng chung / Dữ liệu từ Server:** Lưu ở Zustand Store. Nhớ refetch hoặc update store ngay sau khi có hành động POST/PUT/DELETE để tránh giao diện bị cũ (stale UI).
- **State dùng 1 lần (Form, UI toggle):** Dùng `useState` tại component đó.
- Tuyệt đối không duplicate (nhân bản) state.

### Trải nghiệm người dùng (UX) & Gọi API

- Mọi API call phải đi qua file `apiService.js`, không gọi Axios lung tung.
- Bắt buộc xử lý `try/catch` cho API và hiển thị thông báo (Toast) cho người dùng.
- **Luôn xử lý các trạng thái:**
  - Đang tải (Loading): Hiện skeleton hoặc spinner.
  - Rỗng (Empty): Hiện câu thông báo ý nghĩa, không để màn hình trắng tinh.
  - Lỗi (Error): Báo lỗi rõ ràng.
- Các hành động nguy hiểm (Xóa) bắt buộc phải có Modal xác nhận. Disable nút submit trong lúc đang gửi form để tránh click đúp.

### Styling (Tailwind CSS)

- Dùng các class tiện ích của Tailwind. Hạn chế tối đa việc viết css inline `style={{}}` hoặc tạo file CSS riêng (trừ khi làm animation phức tạp).
- Thiết kế theo hướng **Mobile-first** (Ưu tiên giao diện điện thoại trước).
- Không thao tác trực tiếp với DOM (`document.getElementById`), hãy dùng state hoặc `useRef`.
- Khi render danh sách, không dùng `key={index}` nếu danh sách đó có thể bị xóa/sắp xếp lại. Dùng ID thực tế của dữ liệu.
