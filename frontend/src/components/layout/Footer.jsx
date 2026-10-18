import { Link } from "react-router-dom";
import "./Footer.css";
import wtm from "../../assets/wtm.png";
import EmailIcon from "@mui/icons-material/Email";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

// Các nghiệp vụ cũ được giữ lại dưới dạng comment:
// import { useTranslation } from "react-i18next";
// import wtmDark from "../../assets/wtm.png";
// import wtmLight from "../../assets/wtm_lightmode.png";
// import ThemeAsset from "./ThemeAsset";

const linkGroups = [
  {
    title: "Khám phá",
    links: [
      ["Trang chủ", "/"],
      ["Về chúng tôi", "/about-us"],
      ["Liên hệ", "/contact-us"],
    ],
  },
  {
    title: "Mua sắm",
    links: [
      ["Sản phẩm", "/introduce-hlw26"],
      ["Chi tiết", "/news"],
      ["Giỏ hàng", "/fbgc"],
    ],
  },
  {
    title: "Trải nghiệm AR",
    links: [
      ["Bắt đầu trải nghiệm", "/ar/landmarkId"],
      ["Nội dung di sản", "/landmarks/:id"],
    ],
  },
  {
    title: "Câu hỏi của tôi",
    links: [
      ["Danh sách câu hỏi", "/questions"],
      ["Câu hỏi của tôi", "/profile/questions"],
      ["Tạo câu hỏi", "/profile/questions/create"],
    ],
  },
  {
    title: "Pháp lý",
    links: [
      ["Chính sách dữ liệu", "/data-policy"],
      ["Điều khoản sử dụng", "/terms-of-use"],
      ["Chính sách bảo mật", "/privacy-policy"],
    ],
  },
  {
    title: "Tài khoản",
    links: [
      ["Đăng nhập", "/login"],
      ["Đăng ký", "/register"],
      ["Hồ sơ", "/user-profile"],
    ],
  },
];

function Footer() {
  const year = new Date().getFullYear();
  const [openGroup, setOpenGroup] = useState(linkGroups[0].title);

  return (
    <footer className="fpt-footer">
      <div className="fpt-footer__container">
        <div className="fpt-footer__grid">
          <div className="fpt-footer__contact-section">
            <Link to="/" aria-label="Về trang chủ">
              <img
                src={wtm}
                alt="Logo FPTU Halloween"
                className="fpt-footer__logo"
              />
            </Link>
            <h3 className="fpt-footer__contact-title">Thông tin liên hệ</h3>
            <div className="fpt-footer__contact-item">
              <span className="fpt-footer__contact-icon" aria-hidden="true">
                <EmailIcon fontSize="small" />
              </span>
              <p className="fpt-footer__contact-text">chamsacviet@gmail.com</p>
            </div>
            <div className="fpt-footer__contact-item">
              <span className="fpt-footer__contact-icon" aria-hidden="true">
                <LocationOnIcon fontSize="small" />
              </span>
              <p className="fpt-footer__contact-text">
                Đại học FPT
                <br />
                Khu Công nghệ cao Hòa Lạc
              </p>
            </div>
            <h4 className="fpt-footer__social-title">Kết nối với chúng tôi</h4>
            <div className="fpt-footer__social-buttons">
              <a
                href="https://www.facebook.com/fptuhalloween"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook FPTU Halloween"
                className="fpt-footer__social-btn fpt-footer__social-btn--facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.facebook.com/fuboardgameclub"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook Board Game Club"
                className="fpt-footer__social-btn fpt-footer__social-btn--instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.tiktok.com/@fptu.halloween2025"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok FPTU Halloween"
                className="fpt-footer__social-btn fpt-footer__social-btn--youtube"
              >
                <YouTubeIcon />
              </a>
            </div>
          </div>
          <div className="fpt-footer__links-grid">
            {linkGroups.map((group) => (
              <div className={`fpt-footer__link-group${openGroup === group.title ? " is-open" : ""}`} key={group.title}>
                <button className="fpt-footer__link-title" type="button" onClick={() => setOpenGroup((current) => current === group.title ? "" : group.title)} aria-expanded={openGroup === group.title}>
                  <span>{group.title}</span><ChevronDown size={18} aria-hidden="true" />
                </button>
                <div className="fpt-footer__link-list">
                  {group.links.map(([label, href]) => <Link className="fpt-footer__link" to={href} key={href}>{label}</Link>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr className="fpt-footer__divider" />
      <div className="fpt-footer__copyright">
      © {year} ChamSacViet. Bảo lưu mọi quyền
      </div>
    </footer>
  );
}

export default Footer;
