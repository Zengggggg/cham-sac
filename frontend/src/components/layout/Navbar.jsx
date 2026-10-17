import { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import wtm from "../../assets/wtm.png";
import LogoutModal from "./LogoutModal.jsx";
import {
  KeyRound,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Sparkles,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
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

const authenticatedAccountItems = [
  { label: "Tài khoản", href: "/user-profile", icon: UserRound },
  { label: "Đổi mật khẩu", href: "/enter-old-password", icon: KeyRound },
  { label: "Đơn hàng", href: "/user-profile#orders", icon: Package },
  { label: "Trải nghiệm AR", href: "/haunted-ghost", icon: Sparkles },
];

const readAuthenticationState = () => Boolean(localStorage.getItem("user"));

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const accountRef = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(readAuthenticationState);

  useEffect(() => {
    const syncAuthenticationState = () => {
      setIsAuthenticated(readAuthenticationState());
    };

    window.addEventListener("storage", syncAuthenticationState);
    window.addEventListener("auth:login", syncAuthenticationState);
    window.addEventListener("auth:logout", syncAuthenticationState);

    return () => {
      window.removeEventListener("storage", syncAuthenticationState);
      window.removeEventListener("auth:login", syncAuthenticationState);
      window.removeEventListener("auth:logout", syncAuthenticationState);
    };
  }, []);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen]);

  const handleLogoutRequest = () => {
    setAccountOpen(false);
    setMobileOpen(false);
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setAccountOpen(false);
    setLogoutModalOpen(false);
    window.dispatchEvent(new Event("auth:logout"));
    navigate("/login");
  };

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
              <ShoppingBag size={22} />
            </Link>
            <div className="fpt-navbar__account" ref={accountRef}>
              {isAuthenticated ? (
                <>
                  <button
                    className="fpt-navbar__icon-link fpt-navbar__account-trigger"
                    type="button"
                    onClick={() => setAccountOpen((open) => !open)}
                    aria-label="Tài khoản"
                    aria-expanded={accountOpen}
                    aria-controls="desktop-account-menu"
                    title="Tài khoản"
                  >
                    <PermIdentityIcon
                      className="fpt-navbar__account-icon"
                      sx={{
                        fontSize: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  </button>
                  <div
                    id="desktop-account-menu"
                    className={`fpt-navbar__account-dropdown${accountOpen ? " is-open" : ""}`}
                    role="menu"
                  >
                    {authenticatedAccountItems.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        to={href}
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Icon size={17} aria-hidden="true" /> {label}
                      </Link>
                    ))}
                    <button type="button" role="menuitem" onClick={handleLogoutRequest}>
                      <LogOut size={17} aria-hidden="true" /> Đăng xuất
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="fpt-navbar__icon-link fpt-navbar__account-trigger"
                    type="button"
                    onClick={() => setAccountOpen((open) => !open)}
                    aria-label="Tài khoản"
                    aria-expanded={accountOpen}
                    title="Tài khoản"
                  >
                    <PermIdentityIcon
                      className="fpt-navbar__account-icon"
                      sx={{
                        fontSize: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  </button>
                  <div
                    className={`fpt-navbar__account-dropdown${accountOpen ? " is-open" : ""}`}
                    role="menu"
                  >
                    <Link
                      to="/login"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      <LogIn size={17} aria-hidden="true" /> Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      <UserPlus size={17} aria-hidden="true" /> Đăng ký
                    </Link>
                  </div>
                </>
              )}
            </div>
            <button
              className="fpt-navbar__mobile-toggle"
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div className={`fpt-navbar__mobile-drawer${mobileOpen ? " fpt-navbar__mobile-drawer--open" : ""}`} onClick={() => setMobileOpen(false)}>
          <div className="fpt-navbar__mobile-content" onClick={(event) => event.stopPropagation()}>
            <div className="fpt-navbar__mobile-header">
              <h3>Điều hướng</h3>
              <button className="fpt-navbar__mobile-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={22} /></button>
            </div>
            <nav className="fpt-navbar__mobile-nav" aria-label="Điều hướng mobile">
              {navigationItems.map((item) => <Link key={item.href} to={item.href} className="fpt-navbar__mobile-link" onClick={() => setMobileOpen(false)}>{item.label}</Link>)}
              <div className="fpt-navbar__mobile-account">
                <Link to="/cart" className="fpt-navbar__mobile-link" onClick={() => setMobileOpen(false)}><ShoppingBag size={18} /> Giỏ hàng</Link>
                {isAuthenticated ? <>
                  {authenticatedAccountItems.map(({ label, href, icon: Icon }) => <Link key={href} to={href} className="fpt-navbar__mobile-link" onClick={() => setMobileOpen(false)}><Icon size={18} /> {label}</Link>)}
                  <button type="button" className="fpt-navbar__mobile-link fpt-navbar__mobile-logout" onClick={handleLogoutRequest}><LogOut size={18} /> Đăng xuất</button>
                </> : <>
                  <Link to="/login" className="fpt-navbar__mobile-link" onClick={() => setMobileOpen(false)}><LogIn size={18} /> Đăng nhập</Link>
                  <Link to="/register" className="fpt-navbar__mobile-link" onClick={() => setMobileOpen(false)}><UserPlus size={18} /> Đăng ký</Link>
                </>}
              </div>
            </nav>
          </div>
        </div>
      </div>
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </nav>
  );
}

export default Navbar;
