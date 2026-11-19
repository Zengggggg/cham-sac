# Biên bản kiểm tra — 19/11/2026

## Kiểm tra local đã thực hiện

| Hạng mục | Kết quả |
| --- | --- |
| Backend ESLint trên Node 22.22.0 | Pass, không có warning |
| Backend test suite trên Node 22.22.0 | 106 pass, 0 fail |
| Frontend ESLint trên Node 24.22.3 | 0 error, 4 warning unused import có sẵn |
| Frontend tests trên Node 24.22.3 | 3 pass, 0 fail |
| Production Vite build trên Node 24.22.3 | Pass khi xuất sang `.tmp/frontend-build-cicd` |
| Pipeline script tests trên Node 24.22.3 | 20 pass, 0 fail; dùng response giả lập, không deploy thật |
| Workflow actionlint | Pass |
| Workflow/Render YAML parsing | Pass |
| PowerShell setup script | Parse cú pháp thành công; chưa chạy phần lưu secret |
| Git whitespace check | Pass |
| Diagram PNG/SVG | Đã tạo; PNG đã được xem để kiểm tra bố cục |

Lệnh build mặc định gặp `EPERM` khi Vite dọn `frontend/dist/ar-assets` đang có trên Windows. Giữ nguyên thư mục này và kiểm tra cùng production build với `--outDir ../.tmp/frontend-build-cicd`; build thành công. Runner GitHub checkout mới không dùng thư mục `dist` local này. Build còn các cảnh báo hiện có về MindAR externalized module và chunk lớn, chưa được xử lý trong phạm vi CI/CD.

## Phân biệt với xác minh production

GitHub đã có environment `production`, giới hạn nhánh `main`, cùng ba biến công khai `RENDER_SERVICE_ID`, `PRODUCTION_BACKEND_URL`, `AR_SMOKE_ASSET_PATH`. Chưa có Vercel IDs/domain frontend và hai deployment secret trong environment này tại thời điểm thiết lập. Dashboard hosting chưa được thay đổi trong lượt làm việc này.

Các kiểm tra trên không chứng minh đã deploy thành công lên Render/Vercel. Chỉ coi release production được xác minh khi job `Deploy production` hoàn tất, readiness/public API và frontend smoke trên domain thật đều pass.

Chưa kiểm tra MongoDB replica set thật, camera WebAR trên thiết bị, OTP/Google login hoặc thanh toán đầu cuối trong lượt kiểm tra local này.
