import { LockKeyhole } from "lucide-react";
import PolicyPage from "./PolicyPage.jsx";
import "./Policy.scss";

const sections = [
  {
    heading: "1. Phạm vi của chính sách",
    paragraphs: [
      "Chính sách này giải thích cách Chạm Sắc Việt xử lý thông tin khi bạn truy cập website, tạo tài khoản, sử dụng trải nghiệm AR hoặc gửi nội dung câu hỏi.",
      "Một số liên kết bên ngoài có thể có chính sách riêng. Bạn nên đọc thông tin của dịch vụ bên thứ ba trước khi cung cấp dữ liệu cho họ.",
    ],
  },
  {
    heading: "2. Camera và quyền truy cập thiết bị",
    paragraphs: [
      "Tính năng AR chỉ yêu cầu quyền camera khi bạn chủ động bắt đầu trải nghiệm. Bạn có thể từ chối hoặc thu hồi quyền này trong cài đặt của trình duyệt và thiết bị.",
      "Camera được dùng để nhận diện landmark trên thiết bị. Chạm Sắc Việt không chủ động lưu hoặc gửi video, ảnh camera lên máy chủ cho mục đích nhận diện.",
    ],
  },
  {
    heading: "3. Nội dung công khai và câu hỏi cá nhân",
    paragraphs: [
      "Câu hỏi được bạn gửi trong khu vực công khai có thể được hiển thị cùng tên hiển thị hoặc thông tin tối thiểu cần thiết để người dùng khác theo dõi cuộc trao đổi.",
      "Các bộ câu hỏi trong khu vực cá nhân chỉ hiển thị cho tài khoản của bạn và người có quyền quản trị phù hợp để hỗ trợ vận hành.",
    ],
  },
  {
    heading: "4. Bảo mật tài khoản",
    paragraphs: [
      "Bạn chịu trách nhiệm bảo vệ mật khẩu và thông tin đăng nhập. Hãy thông báo ngay cho chúng mình nếu phát hiện hoạt động bất thường hoặc nghi ngờ tài khoản bị truy cập trái phép.",
      "Chúng mình không yêu cầu bạn cung cấp mật khẩu qua email, tin nhắn hoặc các kênh không chính thức.",
    ],
  },
  {
    heading: "5. Cập nhật chính sách",
    paragraphs: [
      "Chính sách có thể được cập nhật khi sản phẩm, quy định hoặc cách vận hành dữ liệu thay đổi. Phiên bản mới sẽ được đăng trên trang này cùng thời điểm cập nhật.",
    ],
  },
];

export default function TermOfPrivacy() {
  return (
    <PolicyPage
      icon={<LockKeyhole size={24} />}
      eyebrow="Riêng tư và an toàn"
      title="Chính sách bảo mật"
      intro="Chính sách này giúp bạn hiểu rõ hơn về cách Chạm Sắc Việt bảo vệ thông tin cá nhân và quyền riêng tư trong từng trải nghiệm."
      sections={sections}
      note="Việc tiếp tục sử dụng website đồng nghĩa với việc bạn đã đọc và hiểu những nội dung chính sách được công bố tại đây."
    />
  );
}
