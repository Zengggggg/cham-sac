import "./Header.css";
import { Mail } from "lucide-react";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useNavigate } from "react-router-dom";

// Các nghiệp vụ cũ được giữ lại để có thể khôi phục khi cần:
// import hotNewsAPI from "../apis/hotNewsAPI";
// import { ScrollBasedVelocity } from "./ui/scroll-based-velocity";
// import useTheme from "../hooks/use-theme";
// import { useTranslation } from "react-i18next";
// import ThemeAsset from "./ThemeAsset";
// import wtmDark from "../assets/wtm.png";
// import wtmLight from "../assets/wtm_lightmode.png";

function Header() {
  const navigate = useNavigate();
  return (
    <header className="fpt-header">
      <div className="fpt-header__container">
        <div className="fpt-header__content">
          <a
            className="fpt-header__email"
            href="mailto:fptuhalloween@fpt.edu.vn"
          >
            <Mail size={18} strokeWidth={2.4} aria-hidden="true" />
            <span>chamsacviet@gmail.com</span>
          </a>
          <div className="fpt-header__actions">
            <a
              className="fpt-header__social-link"
              href="https://www.facebook.com/fptuhalloween"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              <FacebookIcon fontSize="small" />
            </a>
            <a
              className="fpt-header__social-link"
              href="https://www.youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
            >
              <YouTubeIcon fontSize="small" />
            </a>
            <a
              className="fpt-header__social-link"
              href="https://www.instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <InstagramIcon fontSize="small" />
            </a>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="fpt-header__cta-btn"
            >
              KHÁM PHÁ NGAY
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
