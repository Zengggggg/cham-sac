import { Database } from "lucide-react";
import PolicyPage from "./PolicyPage.jsx";
import "./Policy.scss";

const sections = [
  {
    heading: "1. Thông tin chúng tôi thu thập",
    paragraphs: [
      "Khi bạn đăng ký tài khoản, liên hệ hoặc sử dụng các tính năng dành cho thành viên, Chạm Sắc Việt có thể tiếp nhận họ tên, email và thông tin hồ sơ cần thiết.",
      "Khi bạn gửi câu hỏi hoặc nội dung cộng đồng, chúng tôi lưu nội dung, thời điểm gửi và thông tin tài khoản liên quan để quản lý trải nghiệm trên nền tảng.",
    ],
  },
  {
    heading: "2. Dữ liệu trong trải nghiệm AR",
    paragraphs: [
      "Tính năng AR sử dụng camera và nhận diện hình ảnh ngay trên thiết bị để nhận biết landmark. Hình ảnh camera được xử lý cục bộ và không được tải lên máy chủ chỉ để nhận diện.",
      "Khi bạn mở nội dung di sản, hệ thống có thể gửi mã landmark và dữ liệu cần thiết để tải model 3D, hình ảnh minh họa và nội dung tương ứng.",
    ],
  },
  {
    heading: "3. Mục đích sử dụng dữ liệu",
    paragraphs: [
      "Dữ liệu được sử dụng để tạo và bảo vệ tài khoản, hiển thị nội dung di sản, quản lý câu hỏi cá nhân, cải thiện chất lượng dịch vụ và hỗ trợ khi bạn gửi yêu cầu.",
      "Chúng tôi không sử dụng dữ liệu tài khoản cho mục đích khác với phạm vi vận hành Chạm Sắc Việt nếu chưa có thông báo phù hợp.",
    ],
  },
  {
    heading: "4. Bảo vệ và lưu trữ",
    paragraphs: [
      "Quyền truy cập dữ liệu được giới hạn theo vai trò và mục đích công việc. Chúng tôi áp dụng các biện pháp phù hợp để giảm nguy cơ truy cập, thay đổi hoặc tiết lộ trái phép.",
      "Dữ liệu được lưu trong thời gian cần thiết cho việc vận hành, hỗ trợ, đối soát và các nghĩa vụ liên quan, sau đó sẽ được xóa hoặc ẩn danh khi phù hợp.",
    ],
  },
  {
    heading: "5. Quyền của bạn",
    paragraphs: [
      "Bạn có thể yêu cầu xem, cập nhật hoặc làm rõ việc sử dụng dữ liệu cá nhân của mình. Bạn cũng có thể yêu cầu xóa nội dung câu hỏi hoặc tài khoản, trừ trường hợp chúng tôi cần lưu lại theo nghĩa vụ hợp pháp.",
      "Vui lòng gửi yêu cầu qua trang Liên hệ và cung cấp email tài khoản để chúng tôi xác minh và hỗ trợ chính xác hơn.",
    ],
  },
];

export default function DataPolicy() {
  return (
    <PolicyPage
      icon={<Database size={24} />}
      eyebrow="Thông tin minh bạch"
      title="Chính sách dữ liệu"
      intro="Chúng tôi tôn trọng quyền riêng tư và chỉ sử dụng thông tin cần thiết để vận hành trải nghiệm khám phá di sản của Chạm Sắc Việt."
      sections={sections}
      note="Nếu bạn cần làm rõ cách dữ liệu được sử dụng, hãy liên hệ với Chạm Sắc Việt qua trang Liên hệ."
    />
  );
}
