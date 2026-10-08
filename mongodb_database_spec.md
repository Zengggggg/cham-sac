# MongoDB Database Initialization Specification

**Nguồn:** `Software Design Specification.xlsx` → sheet `Database` (7 nhóm trường, dòng 3–88).  
**Mục đích:** đặc tả để coding agent khởi tạo MongoDB database, collection, JSON Schema validator, index và model ứng dụng.  
**Trạng thái:** đề xuất triển khai MVP; các quyết định thay đổi so với spreadsheet được ghi rõ.

## 1. Quy ước chung

- Database đề xuất: `chamsacviet` (đặt qua `MONGODB_DB_NAME`). Collection: `users`, `payments`, `heritage_sites`, `ar_models`, `products`, `orders`, `game_rules`.
- `_id`: MongoDB `ObjectId`, tự sinh. Các tham chiếu sử dụng `ObjectId` (MongoDB không tự thực thi khóa ngoại; ứng dụng phải kiểm tra tồn tại).
- Dùng `camelCase` cho fields mới, `createdAt`/`updatedAt` là BSON Date UTC. Mặc định `createdAt=now`, `updatedAt=now`, tự cập nhật bằng ứng dụng. MongoDB validator **không sinh giá trị default**.
- Tiền VND: lưu `long` hoặc integer an toàn, đơn vị VND, không dùng floating-point. Nếu dùng Mongoose: `Number` với kiểm tra `Number.isSafeInteger`, hoặc `BigInt`/Long theo driver; không dùng JS float để tính tiền. `quantity`, `stock` là integer không âm.
- URL lưu string `https://...`, file 3D `.glb`; URL không phải đối tượng binary. `webhookPayload` là `object`/document, không phải SQL `JSONB`.
- Validator ở cấp collection bắt buộc kiểu và các trường trọng yếu; kiểm tra chéo collections, tổng giá, luồng trạng thái, thông tin xác thực cần được thực hiện ở service layer/transaction.
- Với dữ liệu null hoặc tùy chọn, chỉ tạo trường khi có giá trị, trừ những trường ghi rõ có thể null. Normalize `email` lowercase/trim, `phone` chuẩn E.164 (+84...).
- Không lưu plain password, OTP, token hoặc thông tin nhạy cảm từ webhook ở log. `passwordHash` (bcrypt/argon2id), cấu hình TTL riêng cho session/OTP nếu tạo collection sau này.

## 2. Review các bất nhất của file gốc

| Nguồn | Vấn đề | Quyết định đề xuất |
|---|---|---|
| Users | `password` Required cứng, nhưng có social login | Đổi `passwordHash`, optional cho tài khoản chỉ dùng OAuth; phải có ít nhất một phương thức đăng nhập hợp lệ (service layer). |
| Users | `isVerified` trùng trạng thái với thời điểm xác minh email | Không lưu `isVerified`; dùng `emailVerifiedAt` làm nguồn dữ liệu duy nhất và chỉ derive `isVerified` trong API response. |
| Users | `phone` unique optional | Unique **partial index** chỉ khi field là string, tránh xung đột nhiều người chưa có số. |
| Payments | `Provider=Payos` trong file; dự án trước định tích hợp SEPay | Đã xác nhận dùng `payos`; schema và integration không còn nhận `sepay`. |
| Payments | `sucess` sai chính tả, `paid_at` Required | Sửa thành `success`; `paidAt` chỉ xuất hiện khi thanh toán thành công. |
| Payments | `JSONB`, tên Pascal/snake case | Dùng `webhookPayload` BSON document, `orderId`, `provider`, `transferContent`. |
| Heritage | `short_description`, `content` Unique | Bỏ unique: nhiều bài có thể trùng nội dung; giữ `targetImageUrl` unique nếu mỗi ảnh tương ứng 1 địa danh. |
| AR model | `default_scale` String, `default_position` bị đánh dấu FK | `defaultScale` là number >0, vị trí và xoay là object `{x,y,z}` chứa số; FK ở vị trí là nhầm. |
| AR model | `heritageSitesID` ghi tham chiếu `Posts_Topic` | Chốt collection thực tế `heritage_sites`; mỗi địa danh có một model: unique `heritageSiteId`. |
| Product | `sould-out` sai chính tả | `sold_out`; không để âm `stock`. |
| Orders | `items [{itemId, isBox, quantity, price}]` thiếu cách xác định sản phẩm | Dùng `productId`, `quantity`, `unitPrice` và snapshot `productName`; `isBox` chỉ giữ nếu thực sự có loại biến thể hộp. |
| Orders | `startDate/endDate` liên quan Premium, không liên quan bán boardgame | Loại khỏi `orders`; chỉ chuyển sang collection subscriptions **nếu** nghiệp vụ Premium được xác nhận. |
| Orders | Thiếu thông tin giao hàng và khách Guest | Bổ sung `customer`, `shippingAddress` (embed), `shippingFee`, `items` snapshot, tránh phụ thuộc user đăng nhập. |
| Game rules | `product_id`, `created_at`, `updated_at` không thống nhất | `productId`, `createdAt`, `updatedAt`; index `productId`, unique nếu 1 bộ luật / sản phẩm. |

## 3. Collection schema (logical contract)

### 3.1 `users`

| Field | BSON | Ràng buộc | Mục đích |
|---|---|---|---|
| `_id` | objectId | PK | ID user |
| `email` | string | required, unique; lowercase | Đăng nhập/khôi phục |
| `passwordHash` | string | optional (required với local auth) | Hash mật khẩu |
| `phone` | string | optional, unique partial | OTP qua SMS |
| `fullName` | string | optional | Tên hiển thị |
| `role` | string | required; `user`/`admin` | RBAC |
| `emailVerifiedAt` | date/null | default null (application) | Nguồn dữ liệu xác minh email; API derive `isVerified = Boolean(emailVerifiedAt)` |
| `createdAt`, `updatedAt` | date | required | Audit |

**Chú ý:** Social login cần bảng/field `authProviders` chứa `{provider, subject}` hoặc collection `user_identities`; chưa có trong spreadsheet. Tuyệt đối không dùng email nhận từ phía client làm bằng chứng đã đăng nhập Google/Facebook.

### 3.2 `payments`

| Field | BSON | Ràng buộc | Mục đích |
|---|---|---|---|
| `_id` | objectId | PK | ID giao dịch |
| `orderId` | objectId | required, ref orders | Đơn hàng |
| `provider` | string | required: `payos` | Cổng thanh toán đã chốt |
| `providerOrderCode` | number | required, unique, integer dương | `orderCode` gửi sang payOS |
| `paymentLinkId` | string | optional, unique partial | ID payment link do payOS trả về |
| `amount` | long | required, ≥0 | VND |
| `transferContent` | string | required | Mã nội dung chuyển khoản |
| `status` | string | required: `pending`, `success`, `failed` | Trạng thái |
| `webhookPayload` | object | optional | Dữ liệu provider đã giới hạn/lọc nhạy cảm |
| `providerTransactionId` | string | optional | Chống xử lý webhook trùng |
| `paidAt` | date | optional | Có khi thanh toán thành công |
| `createdAt`, `updatedAt` | date | required | Audit |

Webhook: kiểm tra chữ ký/xác thực nhà cung cấp theo tài liệu tích hợp, idempotency theo `(provider, providerTransactionId)` khi có transaction ID; update payment và order trong cùng transaction nếu deployment hỗ trợ. `paymentStatus` của order là trạng thái tổng hợp, không thay nguồn giao dịch ở payments.

### 3.3 `heritage_sites`

| Field | BSON | Ràng buộc | Mục đích |
|---|---|---|---|
| `_id` | objectId | PK | Địa danh/chủ đề |
| `name` | string | required | Tên chủ đề |
| `shortDescription` | string | required | Mô tả ngắn |
| `content` | string | required | Nội dung hiển thị AR |
| `targetImageUrl` | string | required, unique | Ảnh dùng làm marker nhận diện |
| `createdAt`, `updatedAt` | date | required | Audit |

Lưu ảnh ngoài MongoDB (file nguồn nói Cloudinary). Content tiếng Việt, xuất bản trực tiếp theo scope MVP. Nếu muốn nhận diện nhiều ảnh/địa danh cần thay unique URL đơn thành collection markers.

### 3.4 `ar_models`

| Field | BSON | Ràng buộc | Mục đích |
|---|---|---|---|
| `_id` | objectId | PK | Model |
| `heritageSiteId` | objectId | required, unique; ref heritage_sites | 1 model hoàn thiện/địa danh |
| `model3dUrl` | string | required | Link `.glb` trên R2 |
| `defaultScale` | double | required, >0 | Scale uniform |
| `defaultPosition` | object `{x,y,z}` | required, số | Vị trí ban đầu |
| `defaultRotation` | object `{x,y,z}` | optional, số; mặc định `{0,0,0}` | Góc Euler, quy ước đơn vị **radian** |
| `thumbnail` | string | optional | Ảnh đại diện |
| `status` | string | required: `draft`, `published`, `hidden`, `deleted` | Trạng thái |
| `createdAt`, `updatedAt` | date | required | Audit |

Nếu frontend dùng độ (`degrees`), phải thống nhất chuyển đổi trước khi lưu/đọc, không trộn đơn vị.

### 3.5 `products`

| Field | BSON | Ràng buộc | Mục đích |
|---|---|---|---|
| `_id` | objectId | PK | Sản phẩm |
| `name` | string | required | Tên boardgame |
| `description` | string | optional | Mô tả |
| `price` | long | required, ≥0 | Đơn giá VND |
| `stock` | int | required, ≥0 | Tồn kho |
| `images` | array<string> | optional, mặc định `[]` | URL ảnh |
| `status` | string | required: `active`, `inactive`, `sold_out` | Trạng thái |
| `createdAt`, `updatedAt` | date | required | Audit |

`stock` là nguồn số lượng; `sold_out` có thể là derived status nhưng nếu lưu cả hai phải đồng bộ khi tồn kho thay đổi.

### 3.6 `orders`

| Field | BSON | Ràng buộc | Mục đích |
|---|---|---|---|
| `_id` | objectId | PK | Đơn hàng |
| `orderCode` | string | required, unique | Mã đơn để tìm kiếm/thanh toán |
| `userId` | objectId | optional, ref users | Null/missing khi khách vãng lai |
| `customer` | object | required | `{fullName, phone, email?}` thông tin người nhận |
| `shippingAddress` | object | required | `{addressLine, ward?, province, note?}` địa chỉ nhận |
| `items` | array<object> | required, min 1 | `{productId, productName, quantity, unitPrice, isBox?}` |
| `shippingFee` | long | required, ≥0 | Phí vận chuyển VND |
| `totalAmount` | long | required, ≥0 | Tổng tiền VND |
| `paymentStatus` | string | required: `unpaid`, `paid`, `refunded` | Tổng hợp thanh toán |
| `orderStatus` | string | required: `pending`, `confirmed`, `shipping`, `done`, `cancelled` | Vận hành |
| `createdAt`, `updatedAt` | date | required | Audit |

**Bất biến service:** `totalAmount = sum(items.quantity × items.unitPrice) + shippingFee` (chưa bao gồm discount/tax nếu bổ sung sau). Giá lấy từ server khi checkout, snapshot để giữ lịch sử. Không tin `unitPrice/totalAmount` gửi từ client. Cập nhật tồn kho nguyên tử/transaction khi xác nhận đơn; có chính sách hoàn kho khi hủy. Không tự động xóa đơn hoặc thanh toán.

### 3.7 `game_rules`

| Field | BSON | Ràng buộc | Mục đích |
|---|---|---|---|
| `_id` | objectId | PK | Bộ luật |
| `productId` | objectId | required, unique; ref products | Sản phẩm áp dụng |
| `title` | string | required | Tiêu đề |
| `summary` | string | required | Tóm tắt |
| `content` | string | required | Toàn văn luật (plain text/Markdown; cần chốt cách render) |
| `coverImageUrl` | string | optional | Cover |
| `createdAt`, `updatedAt` | date | required | Audit |

Nếu sau này mỗi sản phẩm nhiều chương luật có phân phiên bản, bỏ unique `productId` và bổ sung `version`, `status`.

## 4. Quan hệ và index

```text
users (1) -------- (0..N) orders
orders (1) ------- (0..N) payments
products (1) ----- (0..N) orders.items[]    [embedded snapshot]
products (1) ----- (0..1) game_rules
heritage_sites (1) -- (0..1) ar_models
```

| Collection | Index | Unique? | Lý do |
|---|---|---|---|
| users | `{email:1}` | yes | Đăng nhập |
| users | `{phone:1}` partial string | yes | Số điện thoại tùy chọn |
| orders | `{orderCode:1}` | yes | Mã đơn |
| orders | `{userId:1, createdAt:-1}` | no | Lịch sử đơn |
| orders | `{orderStatus:1, createdAt:-1}` | no | Dashboard admin |
| payments | `{orderId:1, createdAt:-1}` | no | Lịch sử thanh toán |
| payments | `{provider:1, providerTransactionId:1}` partial | yes | Idempotency webhook |
| payments | `{transferContent:1}` | no | Đối soát (chỉ unique nếu nghiệp vụ bảo đảm) |
| payments | `{providerOrderCode:1}` | yes | Ánh xạ duy nhất với `orderCode` của payOS |
| payments | `{paymentLinkId:1}` partial string | yes | Tra cứu payment link payOS |
| heritage_sites | `{targetImageUrl:1}` | yes | Marker |
| ar_models | `{heritageSiteId:1}` | yes | Một model/địa danh |
| ar_models | `{status:1}` | no | Lấy published |
| products | `{status:1, createdAt:-1}` | no | Danh mục |
| game_rules | `{productId:1}` | yes | Một luật/sản phẩm |

## 5. Acceptance criteria / công việc cho agent

1. Tạo 7 collections theo thứ tự `users`, `products`, `heritage_sites`, `orders`, `ar_models`, `game_rules`, `payments` bằng `db.createCollection(..., {validator: {$jsonSchema: ...}})`; validator `validationLevel: "strict"`, `validationAction: "error"`.
2. Tạo indexes theo mục 4; script chạy lặp lại an toàn (idempotent) và fail rõ ràng khi dữ liệu đang tồn tại vi phạm unique index.
3. Ánh xạ schema sang DTO/model và validation ở API; timestamps và defaults do ứng dụng sinh trước insert, khi update không cho thay đổi `_id`, `createdAt` tùy tiện.
4. Tạo seed dev tối thiểu: admin test (mật khẩu hash), 1 địa danh + 1 model, 1 sản phẩm + luật; **không seed trên production** và không nhúng credentials cứng trong repo.
5. Test: valid insert; thiếu required; sai enum/BSON type; duplicate email/phone/code; 2 model cùng địa danh; mua hàng Guest; tính tiền trên server; webhook trùng; cập nhật kho cạnh tranh; chỉ expose AR published.
6. Tài liệu migrations mapping (mục 6), env `MONGODB_URI`, `MONGODB_DB_NAME`; không commit secrets.

## 6. Mapping từ file nguồn → schema thống nhất

```text
Users.password -> users.passwordHash
Users.isVerified -> removed; derive API isVerified from users.emailVerifiedAt
Payments.orderID -> payments.orderId
Payments.Provider -> payments.provider
Payments.transfer_content -> payments.transferContent
Payments.webhook_payload -> payments.webhookPayload
Payments.paid_at -> payments.paidAt
Posts_Topic (ngụ ý) -> heritage_sites
Heritage.short_description -> heritage_sites.shortDescription
Heritage.target_image_url -> heritage_sites.targetImageUrl
AR.heritageSitesID -> ar_models.heritageSiteId
AR.model_3d_url -> ar_models.model3dUrl
AR.default_scale -> ar_models.defaultScale
AR.default_position -> ar_models.defaultPosition
AR.default_rotation -> ar_models.defaultRotation
Orders.items[].itemId -> orders.items[].productId
Orders.items[].price -> orders.items[].unitPrice
GameRules.product_id -> game_rules.productId
GameRules.cover_image_url -> game_rules.coverImageUrl
GameRules.created_at / updated_at -> createdAt / updatedAt
```

Thay đổi enum: `sucess` → `success`, `sould-out` → `sold_out`, `Confirm` → `confirmed`, `Cancel` → `cancelled`, mọi enum chuẩn hóa lowercase. Loại `orders.startDate/endDate` cho MVP bán hàng thuần. Không chạy migration trên dữ liệu thật nếu chưa sao lưu và rà soát dữ liệu cũ.

## 7. Các quyết định cần xác nhận trước production

- **Đã chốt:** hệ thống sử dụng payOS; webhook phải được xác minh chữ ký bằng SDK chính thức trước khi cập nhật dữ liệu.
- Hệ thống có đăng nhập Facebook/Google thực tế không? Nếu có, thiết kế thêm identity/link account và xác minh email.
- Địa danh `targetImageUrl` chỉ một ảnh quét hay nhiều ảnh? MVP hiện lấy một.
- `defaultRotation` biểu diễn radians hay degrees? Spec chọn radians.
- Đơn hàng có thực sự liên quan Premium? Spec loại `startDate/endDate` vì bảng mô tả sản phẩm vật lý.
- Phí ship và địa chỉ giao hàng có bắt buộc ở mọi loại đơn? Spec chọn bắt buộc cho đơn sản phẩm vật lý.

> **Lưu ý:** Tài liệu này là hợp đồng thiết kế có đối chiếu file gốc, **không đồng nghĩa** những trường sửa/bổ sung đã được chủ sản phẩm phê duyệt. Nên dùng làm spec thực thi và review trước khi generate code.
