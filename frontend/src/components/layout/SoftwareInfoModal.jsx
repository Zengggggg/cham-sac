import { BriefcaseBusiness, Phone, UserRound } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import "./SoftwareInfoModal.scss";

const developers = [
  {
    name: "Giang Hoàng",
    email: "gianggbgt@gmail.com",
    phone: "0392 304 628",
    role: "PM, PIC Dự án",
  },
  {
    name: "Minh Đặng",
    email: "Chưa cập nhật email",
    phone: "0398 826 650",
    role: "Quản lý Chức năng, Trải nghiệm và Giao diện",
  },
  {
    name: "Đức Nhật",
    email: "Chưa cập nhật email",
    role: "Quản lý chất lượng & quy trình",
    phone: "0916 712 381",
  },
];

function SoftwareInfoModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thông tin phần mềm"
      description="Chạm Sắc Việt - Version 1.0.1"
      size="md"
    >
      <div className="software-info-modal__content">
        <p className="software-info-modal__eyebrow">Hỗ trợ kỹ thuật</p>

        <div className="software-info-modal__developers">
          {developers.map((developer) => (
            <article
              className="software-info-modal__developer"
              key={developer.name}
            >
              <div className="software-info-modal__developer-heading">
                <span
                  className="software-info-modal__avatar"
                  aria-hidden="true"
                >
                  <UserRound size={18} />
                </span>
                <h3>{developer.name}</h3>
              </div>

              <div className="software-info-modal__contact-list">
                <span>
                  <BriefcaseBusiness size={16} aria-hidden="true" />
                  <strong>Chức vụ</strong>
                  {developer.role || "Nhà phát triển"}
                </span>
                {/* <span>
                  <Mail size={16} aria-hidden="true" />
                  <strong>Email</strong>
                  {developer.email}
                </span> */}
                <span>
                  <Phone size={16} aria-hidden="true" />
                  <strong>Số điện thoại</strong>
                  {developer.phone}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default SoftwareInfoModal;
