# Kịch bản giải thích CI/CD với mentor

Thời lượng khoảng 6 phút. Mở [diagram](./pipeline.svg) và [workflow](../../.github/workflows/cicd.yml) cạnh nhau. Phần dưới mô tả thiết kế đã có trong repository; chỉ nói “đã deploy production thành công” sau khi có một Actions run xanh và xác minh domain thật.

## 0:00–0:45 — Bối cảnh và lựa chọn

“Dự án Chạm Sắc Việt có frontend React/Vite, backend Express/Mongoose, MongoDB và asset WebAR trên Cloudflare R2. Frontend đang định hướng chạy trên Vercel, backend trên Render. Vì vậy em chọn GitHub Actions làm nơi kiểm tra code và điều phối phát hành, giữ hai nền tảng hosting sẵn có.

Mục tiêu của pipeline là mỗi thay đổi được kiểm tra trước khi phát hành, và bản code được deploy phải đúng bản đã qua kiểm tra. Cấu hình cũ trong repository tham chiếu một dự án khác, nằm ngoài thư mục GitHub nhận workflow và gọi Dockerfile chưa tồn tại. Em thay bằng workflow phù hợp với stack hiện tại.”

**Chỉ trên diagram:** bên trái là kiểm tra code, bên phải là phát hành.

## 0:45–1:45 — CI và điều kiện merge

“Khi mở pull request vào main, GitHub Actions chạy ba job song song.

Backend cài dependency theo lockfile bằng npm ci, chạy ESLint và bộ test Node.js hiện có. Frontend cũng cài dependency, chạy lint, test và build Vite. Job thứ ba kiểm tra các script điều phối pipeline, chẳng hạn khi Render build lỗi hoặc trả về sai commit thì phải dừng phát hành.

Frontend dùng Node 24 theo môi trường Vercel, backend dùng Node 22 theo cấu hình Render. Em ghi phiên bản vào file .node-version để CI có runtime rõ ràng.

Các job PR không cần secret production. Nhóm cần bật required status checks trong GitHub để không merge khi kiểm tra thất bại. Sau khi merge, CI chạy lại trên SHA của main vì commit sau merge có thể khác commit đã kiểm tra trong PR.”

**Mở workflow:** chỉ ba job `backend`, `frontend`, `pipeline`, sau đó chỉ `needs` của job `production`.

## 1:45–3:00 — CD và đúng phiên bản

“Job production chỉ được chạy trên main sau khi cả ba job kiểm tra thành công. Trước hết pipeline kiểm tra secret, service ID và domain, rồi lấy cấu hình production từ Vercel. Nó xác minh VITE_API_URL trỏ đúng backend cần deploy và build artifact production trước khi thay đổi dịch vụ nào.

Sau đó pipeline gọi Render API với commitId là SHA vừa qua CI. Nó không chỉ gửi lệnh deploy rồi coi là thành công, mà theo dõi đúng deployment ID vừa được tạo đến khi trạng thái live. Nếu Render báo lỗi hoặc SHA không khớp thì frontend chưa được deploy.

Khi backend đạt yêu cầu, pipeline đưa artifact lên Vercel bằng --prebuilt --prod. Artifact đã build được dùng để phát hành, Vercel không chạy lại bước build. Trong cấu hình hai nền tảng, em tắt auto-deploy từ Git để tránh một luồng khác phát hành trước khi CI hoàn tất.”

**Lưu ý khi mentor hỏi build hai lần:**

“Build ở CI xác minh source mà không cần secret. Build production lấy đúng biến môi trường Vercel vì Vite nhúng VITE_* lúc build. Em không dùng artifact không có cấu hình production của PR để đưa lên production.”

## 3:00–4:00 — Kiểm tra sau deploy

“Em phân biệt server còn chạy với server sẵn sàng phục vụ. Endpoint status cũ chỉ báo ứng dụng đang hoạt động. Route readiness mới thực hiện ping MongoDB có thời hạn; nếu database chưa sẵn sàng thì trả 503, lỗi bên trong không được gửi cho người dùng.

Readiness cũng trả SHA do Render cung cấp. Smoke check so SHA này với commit của workflow, kiểm tra CORS cho domain frontend và gọi public AR API. Nhờ đó một backend cũ đang khỏe không thể làm bản deploy mới vượt qua kiểm tra.

Ở frontend, pipeline mở trang chủ và các đường dẫn SPA như /ar, /login; kiểm tra camera Permissions-Policy và file release.json chứa SHA. Với WebAR, pipeline tải vài byte đầu của một model qua proxy và kiểm tra chữ ký glTF. Kiểm tra này phát hiện trường hợp model bị trả về index.html dù HTTP vẫn là 200.”

## 4:00–4:45 — Secret, concurrency và dữ liệu

“Credential deploy nằm trong GitHub Environment production. MongoDB, JWT, Resend, payOS và R2 secret vẫn ở backend. Biến VITE_* là công khai trong bundle, nên chỉ chứa những giá trị trình duyệt được phép biết.

Pipeline chỉ cần quyền đọc source trên GitHub, không cần SSH VM hay quyền push Docker image. Em ghim SHA của GitHub Actions và phiên bản CLI để thay đổi công cụ được kiểm soát.

Các lần deploy production không tự hủy nhau giữa chừng. Pipeline không chạy seed hay migration MongoDB tự động; thay đổi dữ liệu phải có kế hoạch riêng vì rollback code không hoàn tác được dữ liệu.”

## 4:45–5:30 — Failure và rollback

“Nếu lint, test hoặc build lỗi, production chưa bị thay đổi. Nếu Render hoặc smoke backend lỗi, pipeline dừng trước frontend. Nếu Vercel lỗi sau khi backend đã lên thì hai phần có thể đang khác phiên bản.

Vì đây là hai dịch vụ độc lập, em không gọi quá trình này là một transaction hay cam kết tự động rollback toàn bộ. Backend cần tương thích frontend đang chạy. Nhóm có thể rollback từng nền tảng về deployment tốt gần nhất hoặc revert commit qua PR. SHA và deployment ID trong Actions Summary giúp truy vết bản đang phát hành.”

## 5:30–6:00 — Giới hạn và cách chứng minh

“Hiện pipeline kiểm thử logic và kiểm tra HTTP sau deploy. Nó chưa thay thế test transaction trên MongoDB replica set thật, kiểm thử thanh toán đầu cuối hay quét AR bằng camera điện thoại. Em ghi rõ giới hạn này trong tài liệu.

Để chứng minh pipeline, em sẽ mở một PR có test cố tình thất bại để thấy deploy bị chặn; sửa test để các check xanh; merge và theo dõi lần lượt production build, Render, backend smoke, Vercel và frontend smoke. Cuối cùng em đối chiếu SHA trong Summary với readiness và release.json.”

## Demo chuẩn bị trước buổi trình bày

1. Hoàn thành Secrets/Variables và cấu hình hosting trong [hướng dẫn kích hoạt](./README.md).
2. Chuẩn bị một PR demo; chỉ cố tình làm lỗi test trên nhánh riêng, không merge lỗi vào main.
3. Mở tab GitHub Actions, workflow source, Render deploy history và Vercel deploy history.
4. Khi demo production, dùng thay đổi nhỏ đã được nhóm chấp thuận; tránh tạo giao dịch, email hoặc thay đổi dữ liệu khách hàng.
5. Dành vài phút cho Render build, dependency install và cold start; nếu mạng không ổn định, dùng một run đã hoàn thành và nói rõ đó là lịch sử chạy.
6. Chụp/lưu Summary, mở `<backend>/chamsacviet/health/ready` và `<frontend>/release.json?commit=<SHA>` để đối chiếu.

## Câu hỏi mentor có thể hỏi

**Tại sao dùng GitHub Actions thay vì chỉ bật auto-deploy?**

“Để lint/test/build là điều kiện phát hành, kiểm soát thứ tự backend rồi frontend, xác nhận đúng SHA và tập trung kết quả trong một workflow.”

**Tại sao chưa dùng Docker hoặc Kubernetes?**

“Các dịch vụ hiện tại chạy được trên managed Node/Vite hosting. Docker/Kubernetes chỉ nên bổ sung khi có nhu cầu đóng gói hoặc vận hành cụ thể, vì chúng làm tăng phần cấu hình và bảo trì.”

**Có bảo đảm không gián đoạn hoặc không có bug không?**

“Không. Hosting quản lý quá trình chuyển deployment, còn pipeline bổ sung các chốt kiểm tra. Chúng chỉ bao phủ những hành vi đã được kiểm thử. Độ tin cậy còn phụ thuộc runtime, dữ liệu, khả năng tương thích API và các dịch vụ ngoài.”

**Tại sao chỉ gọi HTTP, không chạy camera trong CI?**

“HTTP check nhanh và xác minh được routing, cấu hình, release và asset. Camera/image tracking còn phụ thuộc phần cứng, trình duyệt và ánh sáng; cần test trên thiết bị thật. Có thể bổ sung Playwright cho các luồng trình duyệt không cần camera.”

**Nếu một developer push commit khác trong lúc deploy?**

“Render nhận commitId cụ thể, Vercel build từ checkout của workflow, hai smoke check đối chiếu SHA. Run production không tự hủy giữa chừng; GitHub quản lý hàng đợi, có thể bỏ qua pending run trung gian khi có run mới.”

**Migration và rollback database thì sao?**

“Chưa tự động hóa migration trong pipeline này. Nhóm cần backup, migration tương thích ngược và kế hoạch phục hồi riêng; không coi rollback deployment là rollback dữ liệu.”

**Đã chạy production chưa?**

“Em phân biệt ba mức: đã có mã workflow, đã kiểm thử local, và đã chạy thành công trên GitHub/hosting. Em chỉ xác nhận mức cuối khi có run thực tế và bằng chứng kiểm tra domain.”
