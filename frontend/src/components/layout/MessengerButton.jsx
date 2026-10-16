import { useState } from "react";
import { HelpCircle, MessageCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import "./MessengerButton.scss";
import logo from "../../assets/wtm.png";
export default function MessengerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="messenger-wrapper">
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
              Chúng tôi có thể hỗ trợ bạn.
            </div>
          </div>

          <div className="popup-footer">
            <a
              href="https://m.me/fptuhalloween"
              target="_blank"
              rel="noopener noreferrer"
              className="start-chat-btn"
            >
              <MessageCircle className="btn-icon" aria-hidden="true" />
              Nhắn tin với chúng tôi
            </a>
          </div>
        </div>
      )}

      <div className="messenger-fab-stack">
        {/* Nút bấm tròn lơ lửng */}
        <button
          className="messenger-fab"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Mở Messenger"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X size={24} aria-hidden="true" />
          ) : (
            <MessageCircle size={28} aria-hidden="true" />
          )}
        </button>

        <Link
          className="faq-fab"
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
