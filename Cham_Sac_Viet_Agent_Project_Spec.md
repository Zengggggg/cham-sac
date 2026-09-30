# Chạm Sắc Việt — Agent Project Specification

**Trạng thái:** Draft v1.0  
**Cập nhật:** 2026-09-30  
**Đối tượng sử dụng:** Coding agent, developer, reviewer và QA  
**Ngôn ngữ sản phẩm:** Tiếng Việt

---

## 1. Mục đích tài liệu

Tài liệu này là nguồn tham chiếu chính để agent hiểu và triển khai MVP Chạm Sắc Việt. Agent phải ưu tiên các quyết định trong tài liệu này hơn các giả định kỹ thuật chung.

Khi một yêu cầu chưa được chốt và nằm trong mục **Open Decisions**, agent phải hỏi lại hoặc giữ giải pháp ở mức có thể cấu hình; không được tự mở rộng phạm vi.

## 2. Tổng quan sản phẩm

Chạm Sắc Việt là website kết hợp ba nhóm chức năng:

1. Bán boardgame Chạm Sắc Việt.
2. Quản lý người dùng và đơn hàng.
3. Trải nghiệm di sản bằng WebAR: người dùng đưa camera vào hình ảnh tương ứng với một địa danh; hệ thống nhận diện ảnh và hiển thị model 3D cùng nội dung giới thiệu.

MVP có 9 địa danh và 9 model 3D. Mỗi địa danh sử dụng một model 3D hoàn thiện duy nhất.

## 3. Các quyết định đã chốt

### 3.1 Trải nghiệm AR

- Người dùng không cần đăng nhập để sử dụng AR.
- AR được kích hoạt bằng cách quét hình ảnh tương ứng với địa danh, không phải quét QR.
- Nhận diện ảnh nên chạy trên thiết bị/trình duyệt. Không tải ảnh camera hoặc video người dùng lên backend.
- Mỗi địa danh có một ảnh target trong MVP.
- Một bộ target đã biên dịch chứa các target của 9 địa danh.
- Khi nhận diện được `target_index`, frontend tải đúng model 3D và nội dung địa danh.
- Model production ưu tiên định dạng `.glb`, được tải từ object storage/CDN.
- Mỗi địa danh có đúng một trải nghiệm AR đang hoạt động.

### 3.2 Nội dung

- Nội dung chỉ sử dụng tiếng Việt.
- Nội dung được cập nhật và xuất bản trực tiếp; MVP không có workflow duyệt nhiều bước.
- Nội dung địa danh gồm tối thiểu: giới thiệu, lịch sử, kiến trúc, câu chuyện văn hóa và hình ảnh.
- Luật chơi được trình bày theo chương/mục và có thể kèm hình minh họa.
- MVP không có chatbot AI. Nếu có tìm kiếm luật chơi thì dùng tìm kiếm theo từ khóa/chương mục.

### 3.3 Người dùng

- Có module quản lý người dùng.
- Người dùng có thể đăng nhập bằng email hoặc số điện thoại.
- Cơ chế dự kiến là OTP; không mặc định yêu cầu mật khẩu.
- Schema MVP chỉ có hai vai trò: `customer` và `admin`.
- Một người dùng có một địa chỉ mặc định lưu trực tiếp trong bảng `users`.

### 3.4 Bán hàng

- MVP bán boardgame Chạm Sắc Việt.
- Schema được phép hỗ trợ nhiều sản phẩm nhưng không xây hệ thống biến thể phức tạp.
- Thanh toán chuyển khoản/VietQR được xác nhận qua SePay.
- Giá tiền, tên sản phẩm và địa chỉ giao hàng phải được snapshot vào đơn hàng.
- Không tin giá tiền do frontend gửi lên; backend phải tính lại từ database.

### 3.5 Hạ tầng

- Frontend: React, triển khai trên Vercel.
- Backend: triển khai trên Railway; Nodejs.
- Database: MongoDB.
- Ảnh, target bundle và model 3D: Cloudflare R2 hoặc storage tương thích S3.
- SePay: nhận webhook để xác nhận giao dịch.
- Secret chỉ được lưu trong biến môi trường, không commit vào repository.

## 4. Vai trò người dùng

### 4.1 Khách chưa đăng nhập

- Xem trang chủ và giới thiệu dự án.
- Xem sản phẩm boardgame.
- Xem luật chơi.
- Mở camera và quét hình ảnh địa danh.
- Xem model 3D và nội dung di sản.
- Có thể đặt hàng nếu guest checkout được chốt sử dụng.

### 4.2 Khách hàng đã đăng nhập

- Thực hiện toàn bộ chức năng công khai.
- Xem và sửa hồ sơ, địa chỉ mặc định.
- Đặt hàng.
- Xem lịch sử và trạng thái đơn hàng.

### 4.3 Quản trị viên

- Quản lý người dùng và trạng thái tài khoản.
- Quản lý sản phẩm, giá, tồn kho và hình ảnh.
- Quản lý đơn hàng, trạng thái thanh toán và vận chuyển.
- Quản lý nội dung luật chơi.
- Quản lý địa danh, nội dung, ảnh target và model 3D.
- Bật hoặc tắt trải nghiệm AR.

## 5. Luồng nghiệp vụ chính

### 5.1 Luồng AR

1. Người dùng mở trang quét AR.
2. Frontend yêu cầu quyền camera.
3. Frontend tải target bundle hiện hành.
4. Người dùng hướng camera vào hình ảnh địa danh.
5. AR engine nhận diện `target_index`.
6. Frontend tìm trải nghiệm AR tương ứng.
7. Frontend tải model `.glb`, poster và nội dung địa danh.
8. Model được neo theo ảnh target và hiển thị trên camera.
9. Khi mất target, ứng dụng xử lý theo cấu hình engine; mặc định tạm ẩn hoặc tạm dừng model.
10. Nếu thiết bị không hỗ trợ camera/AR, hiển thị poster, model viewer hoặc nội dung địa danh làm fallback.

### 5.2 Luồng đăng nhập OTP

1. Người dùng nhập email hoặc số điện thoại.
2. Backend tạo OTP, lưu dạng hash với thời hạn ngắn hoặc sử dụng dịch vụ OTP.
3. Hệ thống gửi OTP.
4. Người dùng nhập OTP.
5. Backend xác minh OTP và phát hành session/token.
6. Nếu chưa có tài khoản, tạo `users`; nếu đã có thì cập nhật `last_login_at`.

OTP không được lưu plaintext lâu dài trong bảng `users`.

### 5.3 Luồng đặt hàng và SePay

1. Người mua chọn sản phẩm và số lượng.
2. Backend đọc giá hiện hành từ `products`.
3. Backend kiểm tra tồn kho và tạo `orders`, `order_items` trong transaction.
4. Backend tạo nội dung chuyển khoản duy nhất và bản ghi `payments`.
5. Frontend hiển thị VietQR/thông tin chuyển khoản.
6. SePay gửi webhook khi ngân hàng ghi nhận giao dịch.
7. Backend xác thực webhook và kiểm tra idempotency bằng `external_transaction_id`.
8. Nếu số tiền và nội dung chuyển khoản khớp, cập nhật `payments.status = success`, `orders.payment_status = paid`.
9. Quản trị viên xử lý xác nhận, đóng gói và giao hàng.

Webhook gửi lại nhiều lần không được làm thay đổi tồn kho hoặc trạng thái đơn nhiều lần.

## 6. Phạm vi database MVP

Database có 8 bảng chính. Không tách thêm bảng nếu chưa có nhu cầu nghiệp vụ rõ ràng.

### 6.1 `users`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | UUID | PK | ID người dùng |
| `full_name` | VARCHAR(150) | NOT NULL | Họ tên |
| `email` | VARCHAR(255) | UNIQUE, NULL | Email đăng nhập |
| `phone` | VARCHAR(20) | UNIQUE, NULL | Số điện thoại đăng nhập |
| `address` | TEXT | NULL | Địa chỉ mặc định |
| `avatar_url` | TEXT | NULL | Ảnh đại diện trên R2/CDN |
| `email_verified_at` | TIMESTAMPTZ | NULL | Thời điểm xác minh email |
| `phone_verified_at` | TIMESTAMPTZ | NULL | Thời điểm xác minh điện thoại |
| `role` | VARCHAR(20) | DEFAULT `customer` | `customer`, `admin` |
| `status` | VARCHAR(20) | DEFAULT `active` | `active`, `blocked` |
| `last_login_at` | TIMESTAMPTZ | NULL | Lần đăng nhập gần nhất |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm cập nhật |

Quy tắc: phải có ít nhất `email` hoặc `phone`.

### 6.2 `products`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | UUID | PK | ID sản phẩm |
| `name` | VARCHAR(255) | NOT NULL | Tên sản phẩm |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | Chuỗi URL thân thiện |
| `sku` | VARCHAR(100) | UNIQUE, NOT NULL | Mã sản phẩm |
| `description` | TEXT | NULL | Mô tả |
| `price` | NUMERIC(14,2) | NOT NULL, >= 0 | Giá bán VNĐ |
| `stock_quantity` | INTEGER | DEFAULT 0, >= 0 | Tồn kho |
| `thumbnail_url` | TEXT | NULL | Ảnh đại diện |
| `images` | JSONB | DEFAULT `[]` | Danh sách ảnh và chú thích |
| `status` | VARCHAR(20) | DEFAULT `active` | `active`, `inactive`, `sold_out` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm cập nhật |

### 6.3 `orders`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | UUID | PK | ID đơn hàng |
| `order_code` | VARCHAR(50) | UNIQUE, NOT NULL | Mã hiển thị |
| `user_id` | UUID | FK `users.id`, NULL | NULL nếu guest checkout |
| `customer_name` | VARCHAR(150) | NOT NULL | Snapshot người nhận |
| `customer_phone` | VARCHAR(20) | NOT NULL | SĐT người nhận |
| `customer_email` | VARCHAR(255) | NULL | Email nhận xác nhận |
| `shipping_address` | TEXT | NOT NULL | Snapshot địa chỉ giao hàng |
| `subtotal_amount` | NUMERIC(14,2) | >= 0 | Tổng tiền hàng |
| `shipping_fee` | NUMERIC(14,2) | DEFAULT 0, >= 0 | Phí vận chuyển |
| `total_amount` | NUMERIC(14,2) | >= 0 | Tổng thanh toán |
| `payment_status` | VARCHAR(20) | DEFAULT `unpaid` | `unpaid`, `paid`, `failed`, `refunded` |
| `order_status` | VARCHAR(20) | DEFAULT `pending` | `pending`, `confirmed`, `shipping`, `completed`, `cancelled` |
| `shipping_provider` | VARCHAR(100) | NULL | Đơn vị giao hàng |
| `tracking_code` | VARCHAR(100) | NULL | Mã vận đơn |
| `note` | TEXT | NULL | Ghi chú |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm đặt |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm cập nhật |

### 6.4 `order_items`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | UUID | PK | ID dòng sản phẩm |
| `order_id` | UUID | FK `orders.id`, NOT NULL | Đơn hàng |
| `product_id` | UUID | FK `products.id`, NOT NULL | Sản phẩm |
| `product_name` | VARCHAR(255) | NOT NULL | Snapshot tên sản phẩm |
| `unit_price` | NUMERIC(14,2) | >= 0 | Snapshot đơn giá |
| `quantity` | INTEGER | > 0 | Số lượng |
| `line_total` | NUMERIC(14,2) | >= 0 | `unit_price * quantity` |

### 6.5 `payments`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | UUID | PK | ID thanh toán |
| `order_id` | UUID | FK `orders.id`, UNIQUE | MVP: một payment/đơn |
| `provider` | VARCHAR(30) | DEFAULT `sepay` | Nhà cung cấp |
| `amount` | NUMERIC(14,2) | > 0 | Số tiền cần trả |
| `transfer_content` | VARCHAR(100) | UNIQUE, NOT NULL | Nội dung chuyển khoản |
| `external_transaction_id` | VARCHAR(100) | UNIQUE, NULL | Mã giao dịch SePay/ngân hàng |
| `status` | VARCHAR(20) | DEFAULT `pending` | `pending`, `success`, `failed` |
| `raw_webhook_payload` | JSONB | NULL | Payload phục vụ đối soát |
| `paid_at` | TIMESTAMPTZ | NULL | Thời điểm thanh toán |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm cập nhật |

### 6.6 `heritage_sites`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | UUID | PK | ID địa danh |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Mã nội bộ |
| `name` | VARCHAR(255) | NOT NULL | Tên địa danh |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | URL thân thiện |
| `short_description` | TEXT | NULL | Mô tả tại danh sách |
| `content` | JSONB | DEFAULT `{}` | Giới thiệu, lịch sử, kiến trúc, văn hóa |
| `address` | TEXT | NULL | Địa chỉ địa danh |
| `cover_image_url` | TEXT | NULL | Ảnh đại diện |
| `gallery_images` | JSONB | DEFAULT `[]` | Danh sách ảnh và chú thích |
| `status` | VARCHAR(20) | DEFAULT `active` | `active`, `inactive` |
| `sort_order` | INTEGER | DEFAULT 0 | Thứ tự hiển thị |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm cập nhật |

### 6.7 `ar_experiences`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | UUID | PK | ID trải nghiệm |
| `heritage_site_id` | UUID | FK `heritage_sites.id`, UNIQUE | Một AR/địa danh |
| `target_index` | INTEGER | UNIQUE, NOT NULL | Chỉ số target trong bundle |
| `target_image_url` | TEXT | NOT NULL | Ảnh nguồn dùng nhận diện |
| `target_bundle_url` | TEXT | NOT NULL | File target đã biên dịch |
| `model_3d_url` | TEXT | NOT NULL | File `.glb` production |
| `model_poster_url` | TEXT | NULL | Poster/fallback |
| `default_scale` | NUMERIC(8,4) | DEFAULT 1 | Tỷ lệ model |
| `default_position` | JSONB | DEFAULT `{}` | `{x,y,z}` |
| `default_rotation` | JSONB | DEFAULT `{}` | `{x,y,z}` |
| `animation_config` | JSONB | NULL | Animation và autoplay |
| `instruction_text` | TEXT | NULL | Hướng dẫn quét |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái sử dụng |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm cập nhật |

### 6.8 `game_rules`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | UUID | PK | ID luật chơi |
| `product_id` | UUID | FK `products.id`, UNIQUE | Một bộ luật/sản phẩm |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề |
| `summary` | TEXT | NULL | Tóm tắt |
| `content` | JSONB | DEFAULT `[]` | Chương, nội dung và ảnh |
| `cover_image_url` | TEXT | NULL | Ảnh đại diện |
| `status` | VARCHAR(20) | DEFAULT `active` | `active`, `inactive` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Thời điểm cập nhật |

## 7. Cấu trúc JSONB chuẩn

Agent không được lưu JSONB tùy ý. Các field phải tuân theo shape sau.

### `products.images`

```json
[
  {
    "url": "https://cdn.example.com/products/front.webp",
    "alt": "Mặt trước hộp Chạm Sắc Việt",
    "sort_order": 0
  }
]
```

### `heritage_sites.content`

```json
{
  "introduction": "Giới thiệu địa danh",
  "history": "Lịch sử hình thành",
  "architecture": "Đặc điểm kiến trúc",
  "cultural_story": "Câu chuyện văn hóa",
  "notes": []
}
```

### `heritage_sites.gallery_images`

```json
[
  {
    "url": "https://cdn.example.com/heritage/site/image.webp",
    "caption": "Chú thích ảnh",
    "alt": "Mô tả ảnh cho accessibility",
    "sort_order": 0
  }
]
```

### `ar_experiences.default_position` và `default_rotation`

```json
{
  "x": 0,
  "y": 0,
  "z": 0
}
```

### `ar_experiences.animation_config`

```json
{
  "autoplay": true,
  "initial_animation": "Idle",
  "loop": true
}
```

### `game_rules.content`

```json
[
  {
    "section_id": "setup",
    "title": "Chuẩn bị",
    "body": "Nội dung hướng dẫn",
    "images": [],
    "sort_order": 0
  }
]
```

## 8. API đề xuất

Đường dẫn có thể điều chỉnh theo convention của codebase, nhưng nghiệp vụ phải được giữ nguyên.

### 8.1 Auth và người dùng

| Method | Endpoint | Mục đích | Quyền |
|---|---|---|---|
| POST | `/api/auth/send-otp` | Gửi OTP qua email/điện thoại | Public |
| POST | `/api/auth/verify-otp` | Xác minh OTP và đăng nhập | Public |
| POST | `/api/auth/logout` | Đăng xuất | User |
| GET | `/api/users/me` | Xem hồ sơ | User |
| PATCH | `/api/users/me` | Sửa hồ sơ và địa chỉ | User |
| GET | `/api/admin/users` | Danh sách người dùng | Admin |
| PATCH | `/api/admin/users/:id/status` | Khóa/mở tài khoản | Admin |

### 8.2 Sản phẩm và luật chơi

| Method | Endpoint | Mục đích | Quyền |
|---|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm | Public |
| GET | `/api/products/:slug` | Chi tiết sản phẩm | Public |
| GET | `/api/products/:id/game-rules` | Xem luật chơi | Public |
| POST | `/api/admin/products` | Tạo sản phẩm | Admin |
| PATCH | `/api/admin/products/:id` | Sửa sản phẩm | Admin |
| PUT | `/api/admin/products/:id/game-rules` | Cập nhật luật chơi | Admin |

### 8.3 Đơn hàng và thanh toán

| Method | Endpoint | Mục đích | Quyền |
|---|---|---|---|
| POST | `/api/orders` | Tạo đơn hàng | Public/User tùy quyết định guest checkout |
| GET | `/api/orders/:orderCode` | Tra cứu đơn | Chủ đơn/Admin |
| GET | `/api/users/me/orders` | Lịch sử đơn | User |
| GET | `/api/admin/orders` | Quản lý đơn | Admin |
| PATCH | `/api/admin/orders/:id/status` | Cập nhật trạng thái | Admin |
| POST | `/api/payments/sepay/webhook` | Nhận webhook SePay | SePay |

### 8.4 Di sản và AR

| Method | Endpoint | Mục đích | Quyền |
|---|---|---|---|
| GET | `/api/heritage-sites` | Danh sách địa danh | Public |
| GET | `/api/heritage-sites/:slug` | Nội dung địa danh | Public |
| GET | `/api/ar/experiences` | Cấu hình AR đang hoạt động | Public |
| GET | `/api/ar/experiences/target/:targetIndex` | Tra trải nghiệm từ target | Public |
| POST | `/api/admin/heritage-sites` | Tạo địa danh | Admin |
| PATCH | `/api/admin/heritage-sites/:id` | Sửa nội dung | Admin |
| PUT | `/api/admin/heritage-sites/:id/ar` | Cập nhật AR/model | Admin |

## 9. Quy tắc lưu trữ asset

PostgreSQL chỉ lưu URL và metadata cấu hình. File nhị phân phải nằm trên R2.

```text
cham-sac-viet/
├── products/
│   └── <product-slug>/
├── heritage/
│   └── <heritage-slug>/
│       ├── images/
│       ├── target/
│       └── model/<content-hash>.glb
├── ar-target-sets/
│   └── target-set-v1.mind
└── game-rules/
```

Quy tắc:

- Model production phải có tên chứa hash/version để CDN không trả file cũ.
- Không ghi đè model đang được cache; upload file mới và cập nhật URL.
- R2/CDN phải cấu hình CORS cho domain frontend.
- Chỉ admin được upload hoặc thay đổi asset.
- Backend phải kiểm tra MIME type, phần mở rộng và giới hạn dung lượng.
- Không lưu access key R2 trong frontend.

## 10. Yêu cầu bảo mật và toàn vẹn dữ liệu

- Mọi input phải được validate ở backend.
- Admin endpoint phải kiểm tra role ở server, không chỉ ẩn nút trên giao diện.
- OTP có thời hạn, giới hạn số lần thử và rate limit theo IP/định danh.
- Session/token phải có thời hạn và cơ chế thu hồi phù hợp.
- Không log OTP, token, secret hoặc toàn bộ dữ liệu cá nhân nhạy cảm.
- Webhook SePay phải kiểm tra tính xác thực theo cơ chế SePay cung cấp.
- `external_transaction_id` phải unique để chống xử lý trùng.
- Tạo đơn, tạo order items và cập nhật tồn kho phải dùng database transaction.
- Backend tự tính `line_total`, `subtotal_amount` và `total_amount`.
- Không xóa cứng đơn hàng và thanh toán đã phát sinh.
- Camera frame không được gửi hoặc lưu trên server trong MVP.

## 11. Trạng thái nghiệp vụ

### Product status

```text
active | inactive | sold_out
```

### User status

```text
active | blocked
```

### Order status

```text
pending -> confirmed -> shipping -> completed
       \-> cancelled
```

### Payment status

```text
pending -> success
       \-> failed
```

`refunded` thuộc `orders.payment_status`; hoàn tiền tự động không nằm trong MVP.

## 12. Yêu cầu giao diện tối thiểu

### Public

- Trang chủ.
- Danh sách/chi tiết sản phẩm.
- Luật chơi.
- Danh sách/chi tiết địa danh.
- Trang camera quét AR.
- Trang đặt hàng và thanh toán VietQR.
- Trang tra cứu trạng thái đơn.

### User

- Đăng nhập OTP.
- Hồ sơ cá nhân.
- Lịch sử và chi tiết đơn hàng.

### Admin

- Dashboard cơ bản.
- Quản lý người dùng.
- Quản lý sản phẩm và tồn kho.
- Quản lý đơn hàng.
- Quản lý luật chơi.
- Quản lý địa danh.
- Quản lý ảnh target, model 3D và cấu hình AR.

## 13. Tiêu chí nghiệm thu MVP

### AR

- Người chưa đăng nhập mở được camera và trải nghiệm AR.
- Quét đúng ảnh sẽ tải đúng địa danh và đúng model 3D.
- Cả 9 target đều có mapping duy nhất.
- Khi model chưa tải xong phải có loading/poster.
- Có fallback khi thiết bị không hỗ trợ AR hoặc người dùng từ chối camera.
- Không upload camera frame lên backend.

### Người dùng

- Có thể đăng nhập bằng email hoặc số điện thoại theo luồng OTP.
- Có thể cập nhật họ tên và địa chỉ.
- Admin có thể xem và khóa/mở tài khoản.

### Bán hàng

- Giá và tổng tiền do backend tính.
- Tạo đơn thành công sinh mã đơn và nội dung chuyển khoản duy nhất.
- Webhook SePay khớp được giao dịch với đơn hàng.
- Webhook gửi lặp không cập nhật đơn hoặc tồn kho lặp.
- Admin có thể cập nhật trạng thái đơn và mã vận đơn.
- Đơn cũ giữ nguyên tên, giá sản phẩm và địa chỉ đã đặt.

### Nội dung

- Admin sửa được nội dung địa danh, gallery và luật chơi.
- Nội dung public chỉ trả dữ liệu có trạng thái `active`.
- Ảnh và model được tải qua R2/CDN.

## 14. Ngoài phạm vi MVP

Agent không được tự động triển khai các mục sau nếu chưa có yêu cầu mới:

- Chatbot hoặc AI assistant.
- Social login.
- Đa ngôn ngữ.
- Nhiều địa chỉ cho một người dùng.
- Product variant phức tạp.
- Giỏ hàng nhiều phiên kéo dài và đồng bộ đa thiết bị.
- Voucher, coupon, điểm thưởng hoặc loyalty.
- Tích hợp API hãng vận chuyển.
- Hoàn tiền tự động.
- ERP/CRM.
- Workflow duyệt nội dung nhiều bước.
- Nhiều model/LOD cho một địa danh.
- Upload model tùy biến của người dùng.
- Plane detection hoặc đặt model tự do ngoài image tracking.
- Thu thập hoặc lưu video camera người dùng.

## 15. Open Decisions

Các điểm sau chưa được chốt. Agent phải hỏi trước khi implementation phụ thuộc trực tiếp vào chúng:

1. Backend dùng FastAPI hay Node.js.
2. Guest checkout có được phép hay bắt buộc đăng nhập mới đặt hàng.
3. Nhà cung cấp gửi email OTP và SMS OTP.
4. AR engine cuối cùng: MindAR, AR.js hay dịch vụ khác.
5. Quy tắc tính phí vận chuyển.
6. Danh sách chính thức của 9 địa danh.
7. Giới hạn dung lượng, polygon và texture cho model `.glb`.
8. Admin upload trực tiếp qua backend hay dùng presigned URL của R2.
9. Chính sách trừ tồn kho: khi tạo đơn hay khi thanh toán thành công.

## 16. Chỉ dẫn cho coding agent

- Đọc toàn bộ tài liệu trước khi sửa code.
- Trước khi tạo schema hoặc migration, kiểm tra database hiện tại của repository.
- Giữ schema ở mức 8 bảng chính; không chuẩn hóa thành nhiều bảng nhỏ nếu chưa có lý do rõ ràng.
- Dùng UUID cho khóa chính và TIMESTAMPTZ cho thời gian.
- Dùng migration; không sửa database thủ công.
- Tách business logic khỏi controller/route handler.
- Tất cả API phải có DTO/schema validation và response format nhất quán.
- Viết test cho tính toán tiền, trạng thái đơn, webhook idempotency và mapping target AR.
- Không commit `.env`, token, private key hoặc credentials.
- Không thay đổi phạm vi sản phẩm để phù hợp với thư viện/framework.
- Nếu codebase mâu thuẫn với tài liệu này, báo rõ mâu thuẫn trước khi thực hiện thay đổi lớn.
- Khi hoàn thành task, báo cáo: file đã sửa, migration đã tạo, test đã chạy, phần chưa xác minh và quyết định còn mở.

## 17. Definition of Done cho mỗi chức năng

Một chức năng chỉ được coi là hoàn thành khi:

1. Có implementation frontend/backend tương ứng nếu cần.
2. Có validation và xử lý lỗi.
3. Có kiểm tra quyền truy cập.
4. Có migration nếu thay đổi database.
5. Có test cho nghiệp vụ quan trọng.
6. Không để secret trong code.
7. Có trạng thái loading, empty và error trên UI.
8. Tài liệu API hoặc README được cập nhật.
9. Chạy được trong môi trường local bằng cấu hình mẫu.

