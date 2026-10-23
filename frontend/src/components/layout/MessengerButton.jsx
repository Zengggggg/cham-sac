import { useEffect, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { FaFacebookMessenger } from "react-icons/fa";
import { Link } from "react-router-dom";
import Button from "../ui/Button.jsx";
import "./MessengerButton.scss";
import logo from "../../assets/wtm.png";
export default function MessengerButton() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="messenger-wrapper" ref={wrapperRef}>
      {/* Khung Pop-up chat */}
      {isOpen && (
        <div className="messenger-popup">
          <div className="popup-header">
            <div className="header-info">
              {/* Bồ nhớ thay link ảnh logo của dự án vào đây nha */}
              <img src={logo} alt="Chạm Sắc Việt" className="page-avatar" />
              <div className="page-details">
                <h4>Chạm Sắc Việt</h4>
                <p>Đang trực tuyến</p>
              </div>
            </div>
          </div>

          <div className="popup-body">
            <div className="messenger-chat-bubble">
              Xin chào! <br />
              Chúng tôi có thể hỗ trợ gì cho bạn.
            </div>
          </div>

          <div className="popup-footer">
            <Button
              as="a"
              href="https://m.me/61592108695547"
              target="_blank"
              rel="noopener noreferrer"
              className="start-chat-btn"
              icon={<FaFacebookMessenger className="btn-icon" aria-hidden="true" />}
            >
              Nhắn tin với chúng tôi
            </Button>
          </div>
        </div>
      )}

      <div className="messenger-fab-stack">
        {/* Nút bấm tròn lơ lửng */}
        <button
          className="messenger-fab"
          data-onboarding-target="messenger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Mở Messenger"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X size={24} aria-hidden="true" />
          ) : (
            <FaFacebookMessenger size={32} aria-hidden="true" />
          )}
        </button>

        <Link
          className="faq-fab"
          data-onboarding-target="faq"
          to="/faq"
          aria-label="Mở câu hỏi thường gặp"
          title="Câu hỏi thường gặp"
        >
          <HelpCircle size={28} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
