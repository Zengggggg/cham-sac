import { FileText } from "lucide-react";
import PolicyPage from "./PolicyPage.jsx";
import "./Policy.scss";

const sections = [
  {
    heading: "1. Sử dụng website",
    paragraphs: [
      "Bạn có thể truy cập và sử dụng website cho mục đích khám phá nội dung di sản, trải nghiệm AR và tham gia các tính năng cộng đồng được cung cấp.",
      "Bạn cam kết cung cấp thông tin chính xác, không sử dụng website cho mục đích gian lận, gây hại, phá hoại hoặc làm gián đoạn hệ thống.",
    ],
  },
  {
    heading: "2. Tài khoản người dùng",
    paragraphs: [
      "Một số tính năng như quản lý câu hỏi có thể yêu cầu tài khoản. Bạn chịu trách nhiệm về thông tin đã cung cấp và mọi hoạt động phát sinh từ tài khoản của mình.",
      "Chúng tôi có thể tạm khóa hoặc giới hạn tài khoản nếu phát hiện hành vi vi phạm điều khoản, gây ảnh hưởng đến người dùng khác hoặc đến an toàn của hệ thống.",
    ],
  },
  {
    heading: "3. Trải nghiệm AR",
    paragraphs: [
      "Trải nghiệm AR sử dụng hình ảnh landmark để tải nội dung tương ứng. Kết quả nhận diện, model 3D và nội dung hiển thị có thể phụ thuộc vào thiết bị, trình duyệt, ánh sáng và kết nối mạng.",
      "Bạn không được sử dụng tính năng AR để ghi lại, phát tán hoặc khai thác nội dung theo cách xâm phạm quyền riêng tư, quyền sở hữu trí tuệ hoặc quyền của người khác.",
    ],
  },
  {
    heading: "4. Nội dung và quyền sở hữu",
    paragraphs: [
      "Nội dung, hình ảnh, model 3D, giao diện và dấu hiệu nhận diện trên website thuộc phạm vi quản lý của Chạm Sắc Việt hoặc các bên cấp phép tương ứng.",
      "Việc sao chép, chỉnh sửa, phân phối hoặc sử dụng lại nội dung cho mục đích thương mại cần có sự cho phép trước bằng văn bản.",
    ],
  },
  {
    heading: "5. Thay đổi dịch vụ",
    paragraphs: [
      "Chạm Sắc Việt có thể cập nhật, tạm dừng hoặc thay đổi nội dung và tính năng để bảo trì, cải thiện sản phẩm hoặc đáp ứng yêu cầu vận hành.",
      "Các thay đổi quan trọng sẽ được thông báo qua website hoặc kênh liên hệ phù hợp khi cần thiết.",
    ],
  },
];

export default function TermOfUse() {
  return (
    <PolicyPage
      icon={<FileText size={24} />}
      eyebrow="Thỏa thuận sử dụng"
      title="Điều khoản sử dụng"
      intro="Khi truy cập website hoặc sử dụng các dịch vụ của Chạm Sắc Việt, bạn đồng ý với những điều khoản dưới đây."
      sections={sections}
      note="Nếu bạn không đồng ý với một phần của điều khoản, vui lòng dừng sử dụng tính năng liên quan và liên hệ với chúng tôi để được giải đáp."
    />
  );
}
