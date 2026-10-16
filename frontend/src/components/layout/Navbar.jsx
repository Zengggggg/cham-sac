import "./Navbar.css";
import { Link, useLocation } from "react-router-dom";
import wtm from "../../assets/wtm.png";
import { ShoppingBag } from "lucide-react";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";

// Các nghiệp vụ cũ được giữ lại dưới dạng comment để có thể bật lại:
// import { authAPI } from "../apis/authAPI";
// import cartAPI from "../apis/cartAPI";
// import LogoutModal from "./LogoutModal";
// import { CircleUserRound, Dices, FilePenLine, Info, KeyRound, KeyRoundIcon, LogOut, Package, ShoppingBag, Newspaper, Sparkles, Ticket, User, WalletCards } from "lucide-react";
// import feedbackAPI from "../apis/feedbackAPI";
// import toast from "react-hot-toast";
// import { translateSuccess } from "../utils/translateResponse";
// import { CART_UPDATED_EVENT, getCartItemCount } from "../utils/flyingToCart";

const navigationItems = [
  { label: "TRANG CHỦ", href: "/" },
  { label: "MUA SẮM", href: "/introduce-hlw26" },
  { label: "TRẢI NGHIỆM AR", href: "/haunted-ghost" },
  { label: "VỀ CHÚNG TÔI", href: "/btc-fuhlw" },
  { label: "LIÊN HỆ", href: "/contact-us" },
];

function Navbar() {
  const location = useLocation();

  return (
    <nav className="fpt-navbar">
      <div className="fpt-navbar__container">
        <div className="fpt-navbar__content">
          <Link className="fpt-navbar__logo" to="/" aria-label="Về trang chủ">
            <img
              src={wtm}
              alt="FPTU Halloween"
              className="fpt-navbar__logo-img"
            />
          </Link>
          <div className="fpt-navbar__desktop-nav">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`fpt-navbar__nav-link${location.pathname === item.href ? " active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="fpt-navbar__actions">
            <Link
              className="fpt-navbar__icon-link"
              to="/cart"
              aria-label="Giỏ hàng"
              title="Giỏ hàng"
            >
              <ShoppingBag size={23} strokeWidth={2.4} />
            </Link>
            <Link
              className="fpt-navbar__icon-link"
              to="/login"
              aria-label="Tài khoản"
              title="Tài khoản"
            >
              <PermIdentityIcon sx={{ fontSize: 27 }} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
