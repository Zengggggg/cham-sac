# Chạm Sắc Việt

Chạm Sắc Việt là nền tảng web kết hợp thương mại điện tử và trải nghiệm di sản bằng WebAR. Sản phẩm giúp người dùng khám phá các địa danh Việt Nam thông qua boardgame: khi đưa camera vào hình ảnh tương ứng với một địa danh, trình duyệt nhận diện ảnh và hiển thị model 3D cùng nội dung văn hóa liên quan.

MVP tập trung vào ba nhóm chức năng:

1. Giới thiệu và bán boardgame Chạm Sắc Việt.
2. Quản lý người dùng, đơn hàng và thanh toán chuyển khoản/VietQR qua SePay.
3. Trải nghiệm WebAR cho 9 địa danh với 9 model 3D.

> [!IMPORTANT]
> Repository hiện mới ở giai đoạn khởi tạo. Frontend vẫn là màn hình mẫu React/Vite; backend mới có kết nối MongoDB và endpoint kiểm tra trạng thái. Các module nghiệp vụ mô tả bên dưới là phạm vi MVP cần triển khai, không phải tính năng đã hoàn thiện.

## Mục tiêu sản phẩm

Chạm Sắc Việt hướng tới một hành trình liền mạch từ sản phẩm vật lý đến nội dung số:

- Người dùng tìm hiểu và mua boardgame trên website.
- Hình ảnh địa danh trong boardgame đóng vai trò image target cho WebAR.
- Trình duyệt nhận diện target ngay trên thiết bị, sau đó tải đúng model `.glb` và nội dung di sản.
- Người dùng có thể tiếp tục đọc lịch sử, kiến trúc và câu chuyện văn hóa của địa danh.
- Quản trị viên quản lý nội dung, sản phẩm, tồn kho, đơn hàng và cấu hình AR từ hệ thống admin.

Toàn bộ nội dung sản phẩm trong MVP sử dụng tiếng Việt.

## Phạm vi MVP

| Nhóm | Chức năng chính |
| --- | --- |
| Nội dung công khai | Trang chủ, giới thiệu dự án, sản phẩm, luật chơi và nội dung địa danh |
| WebAR | Quét image target, ánh xạ `target_index`, tải model 3D, poster và nội dung fallback |
| Người dùng | Đăng nhập OTP bằng email hoặc số điện thoại, hồ sơ và địa chỉ mặc định |
| Bán hàng | Đặt boardgame, tạo mã đơn, VietQR, thanh toán SePay và tra cứu đơn |
| Quản trị | Quản lý người dùng, sản phẩm, tồn kho, đơn hàng, luật chơi, địa danh và cấu hình AR |
| Lưu trữ asset | Ảnh, target bundle và model `.glb` trên Cloudflare R2 hoặc storage tương thích S3 |

### Ngoài phạm vi MVP

MVP không tự động mở rộng sang chatbot/AI assistant, social login, đa ngôn ngữ, nhiều địa chỉ, product variant phức tạp, voucher/loyalty, tích hợp hãng vận chuyển, hoàn tiền tự động, ERP/CRM, workflow duyệt nội dung nhiều bước, nhiều model/LOD cho một địa danh hoặc plane detection.

## Trải nghiệm WebAR

AR là tính năng công khai, không yêu cầu đăng nhập và không sử dụng QR.

1. Người dùng mở trang quét AR và cấp quyền camera.
2. Frontend tải bộ target đã biên dịch chứa 9 image target.
3. AR engine nhận diện hình ảnh trên thiết bị và trả về `target_index`.
4. Frontend ánh xạ chỉ số này tới đúng địa danh và trải nghiệm AR đang hoạt động.
5. Model `.glb`, poster và nội dung địa danh được tải từ CDN/object storage.
6. Model được neo theo image target; khi mất target, model được tạm ẩn hoặc tạm dừng theo cấu hình engine.
7. Nếu thiết bị không hỗ trợ AR hoặc người dùng từ chối camera, giao diện hiển thị poster, model viewer hoặc nội dung địa danh thay thế.

Camera frame và video của người dùng chỉ được xử lý trên thiết bị, không được gửi hoặc lưu trên backend.

## Vai trò người dùng

### Khách chưa đăng nhập

- Xem trang chủ, sản phẩm, luật chơi và nội dung địa danh.
- Sử dụng camera để trải nghiệm AR.
- Tra cứu trạng thái đơn hàng.
- Đặt hàng nếu guest checkout được chốt sử dụng.

### Khách hàng

- Có toàn bộ quyền công khai.
- Đăng nhập bằng OTP qua email hoặc số điện thoại.
- Cập nhật hồ sơ và địa chỉ mặc định.
- Đặt hàng, xem lịch sử và chi tiết đơn hàng.

### Quản trị viên

- Quản lý người dùng và trạng thái tài khoản.
- Quản lý sản phẩm, giá, tồn kho và hình ảnh.
- Quản lý đơn hàng, thanh toán và vận chuyển.
- Quản lý luật chơi và nội dung địa danh.
- Quản lý image target, target bundle, model 3D và trạng thái trải nghiệm AR.

MVP chỉ có hai role: `customer` và `admin`.

## Kiến trúc định hướng

| Thành phần | Công nghệ/triển khai định hướng | Trách nhiệm |
| --- | --- | --- |
| Frontend | React, Vite, Vercel | Giao diện public/user/admin, camera, image tracking và hiển thị model 3D |
| Backend | Node.js/Express hiện có, Railway | API, xác thực, nghiệp vụ đơn hàng, webhook và quản lý nội dung |
| Database | MongoDB theo code và quyết định hạ tầng hiện tại | Dữ liệu người dùng, sản phẩm, đơn hàng, thanh toán, di sản và AR |
| Object storage | Cloudflare R2 hoặc S3-compatible storage | Ảnh, target bundle, poster và model `.glb` |
| Thanh toán | SePay | Xác nhận giao dịch chuyển khoản qua webhook |
| CDN | R2/CDN | Phân phối asset tĩnh và model 3D có version/hash |

Frontend không được chứa access key của R2. Secret, token và credential chỉ được lưu trong biến môi trường.

## Các miền dữ liệu chính

Đặc tả MVP giới hạn ở 8 miền dữ liệu, không tách thêm nếu chưa có nhu cầu nghiệp vụ rõ ràng:

- `users`: thông tin đăng nhập OTP, hồ sơ, địa chỉ mặc định, role và trạng thái.
- `products`: boardgame, giá, tồn kho, ảnh và trạng thái bán.
- `orders`: người nhận, địa chỉ snapshot, tổng tiền, thanh toán và vận chuyển.
- `order_items`: snapshot tên sản phẩm, đơn giá và số lượng tại thời điểm đặt.
- `payments`: nội dung chuyển khoản, mã giao dịch ngoài và payload webhook SePay.
- `heritage_sites`: nội dung, gallery và trạng thái của địa danh.
- `ar_experiences`: target index, target bundle, model 3D, transform và cấu hình animation.
- `game_rules`: luật chơi được tổ chức theo chương/mục.

Các cấu trúc nội dung linh hoạt phải tuân theo JSON shape được định nghĩa trong đặc tả; không lưu dữ liệu tùy ý chỉ vì database hỗ trợ document/JSON.

## Quy tắc nghiệp vụ quan trọng

- Backend phải tự đọc giá từ dữ liệu sản phẩm và tính `line_total`, `subtotal_amount`, `shipping_fee`, `total_amount`; không tin giá do frontend gửi lên.
- Tên sản phẩm, đơn giá, người nhận và địa chỉ giao hàng phải được snapshot vào đơn hàng.
- Tạo đơn, tạo order items và cập nhật tồn kho phải là một thao tác nhất quán/transactional.
- `external_transaction_id` phải unique; webhook SePay gửi lặp không được trừ tồn kho hoặc cập nhật trạng thái nhiều lần.
- Đơn hàng và thanh toán đã phát sinh không được xóa cứng.
- OTP phải được hash hoặc quản lý bởi nhà cung cấp, có thời hạn, giới hạn số lần thử và rate limit.
- Endpoint admin phải kiểm tra role ở backend, không chỉ ẩn chức năng trên giao diện.
- Nội dung public chỉ trả các bản ghi có trạng thái `active`.
- Model production phải dùng `.glb` và tên file chứa hash/version để tránh CDN trả asset cũ.

## Trạng thái nghiệp vụ

```text
Product: active | inactive | sold_out
User:    active | blocked

Order:   pending -> confirmed -> shipping -> completed
              \-> cancelled

Payment: pending -> success
                \-> failed
```

`refunded` thuộc trạng thái thanh toán của đơn hàng; hoàn tiền tự động không nằm trong MVP.

## Trạng thái triển khai hiện tại

| Hạng mục | Trạng thái |
| --- | --- |
| React/Vite frontend | Đã khởi tạo, vẫn là giao diện starter |
| Express backend | Đã khởi tạo |
| Kết nối MongoDB | Đã có cấu hình qua `MONGODB_URI` |
| Health endpoint | Đã có endpoint legacy `GET /herdays-api/status` |
| Auth/OTP | Chưa triển khai |
| Sản phẩm, đơn hàng, thanh toán | Chưa triển khai |
| SePay webhook | Chưa triển khai |
| Nội dung di sản | Chưa triển khai |
| Image tracking/WebAR | Chưa triển khai |
| R2/CDN integration | Chưa triển khai |
| Admin | Chưa triển khai |
| Automated tests | Chưa cấu hình |

Tên route `/herdays-api` và message `API HerDays is running` là dấu vết từ scaffold cũ. Khi chuẩn hóa API cho Chạm Sắc Việt cần thực hiện như một thay đổi code có kiểm thử, không chỉ sửa tài liệu.

## Công nghệ hiện có trong repository

| Phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite 8, JavaScript/JSX, ESLint, React Compiler |
| Backend | Node.js, Express 4, Mongoose 8, MongoDB, ES modules, Nodemon |
| Package manager | npm với lockfile riêng cho `frontend` và `backend` |

Frontend hiện chưa cài router, AR engine, state manager, data-fetching library hay thư viện component. Backend chưa có validation library, test runner hoặc implementation nghiệp vụ.

## Yêu cầu môi trường local

- Node.js `20.19+` để đáp ứng yêu cầu của Vite 8 và toàn workspace.
- npm đi kèm Node.js.
- MongoDB chạy local hoặc MongoDB Atlas connection string.

Kiểm tra phiên bản:

```bash
node --version
npm --version
```

## Chạy dự án ở local

Frontend và backend chạy trong hai terminal riêng.

### 1. Backend

```bash
cd backend
npm ci
```

Tạo file `backend/.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/cham_sac_viet
PORT=8080
FRONTEND_URL=http://localhost:5173
```

Khởi động development server:

```bash
npm run dev
```

Backend mặc định chạy tại `http://localhost:8080`. Với code hiện tại, kiểm tra server tại:

```text
GET http://localhost:8080/herdays-api/status
```

Kết quả hiện tại:

```json
{
  "message": "API HerDays is running"
}
```

### 2. Frontend

Trong terminal khác:

```bash
cd frontend
npm ci
npm run dev
```

Mở địa chỉ do Vite in trên terminal, mặc định là `http://localhost:5173`.

## Biến môi trường hiện tại

| Biến | Bắt buộc | Mặc định | Mục đích |
| --- | --- | --- | --- |
| `MONGODB_URI` | Có | Không có | Connection string kết nối MongoDB |
| `PORT` | Không | `8080` | Cổng HTTP của backend |
| `FRONTEND_URL` | Không | `http://localhost:5173` | Origin được phép truy cập API qua CORS |

Frontend chưa đọc biến môi trường. Khi bổ sung API client, dùng biến có tiền tố `VITE_`, ví dụ `VITE_API_URL`.

Các integration tương lai như OTP, SePay và R2 sẽ cần thêm biến môi trường sau khi nhà cung cấp và cơ chế tích hợp được chốt. Không tạo tên biến hoặc commit credential trước thời điểm đó.

## Scripts

### Backend

Chạy trong `backend/`:

| Lệnh | Chức năng |
| --- | --- |
| `npm run dev` | Chạy server bằng Nodemon |
| `npm start` | Chạy server bằng Node.js |
| `npm run production` | Chạy production script hiện tại |
| `npm run lint` | Kiểm tra JavaScript trong `src` bằng ESLint |

`npm test` hiện là placeholder và luôn trả về lỗi. Cấu hình backend ESLint hiện cũng có một rule `semi` không hợp lệ cần được sửa trước khi lint có thể chạy thành công.

### Frontend

Chạy trong `frontend/`:

| Lệnh | Chức năng |
| --- | --- |
| `npm run dev` | Chạy Vite development server |
| `npm run build` | Tạo production build trong `dist` |
| `npm run preview` | Xem production build ở local |
| `npm run lint` | Kiểm tra code bằng ESLint |

## Cấu trúc repository

```text
AR_WEB/
├── .agent/
│   ├── rules/                 # Quy ước phát triển hiện có
│   ├── skills/                # Skill backend/frontend theo ngữ cảnh dự án
│   └── workflows/             # Quy trình hỗ trợ phát triển
├── backend/
│   ├── src/
│   │   ├── config/            # Cấu hình ứng dụng và MongoDB
│   │   ├── controllers/       # HTTP request/response handling
│   │   ├── middlewares/       # Express middleware
│   │   ├── models/            # Mongoose schemas/models
│   │   ├── providers/         # OTP, SePay, R2 và dịch vụ ngoài trong tương lai
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── sockets/           # Realtime nếu có yêu cầu
│   │   ├── utils/             # Tiện ích dùng chung
│   │   ├── validations/       # Input validation
│   │   └── server.js          # Backend entry point
│   └── package.json
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── assets/            # Assets được bundle
│   │   ├── components/        # React components
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Frontend entry point
│   └── package.json
├── Cham_Sac_Viet_Agent_Project_Spec.md
└── README.md
```

## Quy ước phát triển

- Đọc toàn bộ đặc tả trước khi triển khai một module nghiệp vụ.
- Nếu codebase và đặc tả mâu thuẫn, báo rõ trước khi thực hiện thay đổi kiến trúc lớn.
- Giữ business logic ngoài controller/route handler.
- Mọi input backend phải được validate và mọi endpoint bảo vệ phải kiểm tra quyền ở server.
- Các nghiệp vụ tiền, trạng thái đơn, webhook idempotency và mapping target AR phải có test.
- UI bất đồng bộ phải có loading, empty và error state phù hợp.
- Không hardcode secret, credential hoặc URL phụ thuộc môi trường.
- Cập nhật README và skill tương ứng khi stack, scripts, biến môi trường hoặc kiến trúc thực tế thay đổi.

Skill theo ngữ cảnh repository:

- `.agent/skills/backend-coding/SKILL.md`
- `.agent/skills/frontend-coding/SKILL.md`

## Các quyết định còn mở

Không tự quyết các điểm sau nếu implementation phụ thuộc trực tiếp vào chúng:

1. Xác nhận tiếp tục Node.js hiện có hay chuyển sang FastAPI.
2. Cho phép guest checkout hay bắt buộc đăng nhập.
3. Nhà cung cấp email OTP và SMS OTP.
4. AR engine: MindAR, AR.js hay dịch vụ khác.
5. Quy tắc tính phí vận chuyển.
6. Danh sách chính thức của 9 địa danh.
7. Giới hạn dung lượng, polygon và texture cho model `.glb`.
8. Admin upload qua backend hay presigned URL của R2.
9. Trừ tồn kho khi tạo đơn hay khi thanh toán thành công.

### Mâu thuẫn kỹ thuật cần chốt trước khi thiết kế database

Đặc tả hạ tầng và code hiện tại sử dụng MongoDB/Mongoose, nhưng phần schema trong đặc tả dùng khái niệm quan hệ của PostgreSQL như UUID, foreign key, `TIMESTAMPTZ`, `JSONB`, migration và transaction nhiều bảng; mục lưu trữ asset cũng nhắc trực tiếp PostgreSQL. Trước khi tạo schema dữ liệu chính thức, đội dự án cần xác nhận một trong hai hướng:

- giữ MongoDB và chuyển các ràng buộc/schema sang thiết kế document phù hợp; hoặc
- chuyển sang PostgreSQL và cập nhật backend, dependency, cấu hình triển khai cùng tài liệu.

Không nên tạo schema production trước khi quyết định này được chốt.

## Definition of Done

Một chức năng chỉ được coi là hoàn thành khi:

1. Có frontend/backend tương ứng nếu nghiệp vụ yêu cầu.
2. Có validation, xử lý lỗi và kiểm tra quyền truy cập.
3. Có migration hoặc cơ chế thay đổi schema phù hợp với database đã chốt.
4. Có test cho nghiệp vụ quan trọng.
5. Không chứa secret trong source code.
6. UI có loading, empty và error state.
7. README hoặc tài liệu API đã được cập nhật.
8. Chạy được trong môi trường local bằng cấu hình mẫu.

## Tài liệu nguồn

- [Đặc tả Chạm Sắc Việt — Draft v1.0](./Cham_Sac_Viet_Agent_Project_Spec.md)
- [Backend coding skill](./.agent/skills/backend-coding/SKILL.md)
- [Frontend coding skill](./.agent/skills/frontend-coding/SKILL.md)
