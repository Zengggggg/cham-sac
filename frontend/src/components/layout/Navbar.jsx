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
  MessageCircleQuestion,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import { logoutUser } from "../../services/authService.js";
import { getAccessToken } from "../../services/apiClient.js";
import { getCart } from "../../services/shopService.js";
import { APP_VERSION } from "../../data/appVersion.js";

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
  { label: "MUA SẮM", href: "/products" },
  { label: "TRẢI NGHIỆM AR", href: "/ar" },
  { label: "VỀ CHÚNG MÌNH", href: "/about-us" },
  { label: "LIÊN HỆ", href: "/contact-us" },
  { label: "QUẢN TRỊ", href: "/admin/dashboard" },
];

const authenticatedAccountItems = [
  { label: "Tài khoản", href: "/user-profile", icon: UserRound },
  { label: "Đổi mật khẩu", href: "/enter-old-password", icon: KeyRound },
  { label: "Đơn hàng", href: "/my-orders", icon: Package },
  { label: "Câu hỏi của bạn", href: "/questions", icon: MessageCircleQuestion },
];

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const accountRef = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [cartCount, setCartCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const previousCartCount = useRef(null);
  const cartAnimationTimeout = useRef(null);
  const isAuthenticated = Boolean(currentUser);
  const visibleNavigationItems = navigationItems.filter((item) => item.href !== "/admin/dashboard" || currentUser?.role === "admin");

  useEffect(() => {
    const syncAuthenticationState = () => {
      setCurrentUser(readStoredUser());
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
    let isActive = true;

    const syncCartCount = async (shouldAnimate = false) => {
      if (!getAccessToken()) {
        previousCartCount.current = 0;
        if (isActive) setCartCount(0);
        return;
      }

      try {
        const response = await getCart();
        const items = response?.data?.cart?.items || [];
        const nextCount = items.reduce(
          (total, item) => total + (Number(item.quantity) || 0),
          0,
        );
        const countChanged = previousCartCount.current !== null
          && nextCount !== previousCartCount.current;

        if (!isActive) return;
        setCartCount(nextCount);
        previousCartCount.current = nextCount;

        if (shouldAnimate && countChanged) {
          setCartBump(false);
          window.requestAnimationFrame(() => setCartBump(true));
          window.clearTimeout(cartAnimationTimeout.current);
          cartAnimationTimeout.current = window.setTimeout(
            () => setCartBump(false),
            520,
          );
        }
      } catch {
        if (isActive) {
          previousCartCount.current = 0;
          setCartCount(0);
        }
      }
    };

    const handleCartUpdated = () => { void syncCartCount(true); };
    const handleAuthChanged = () => { void syncCartCount(false); };

    void syncCartCount(false);
    window.addEventListener("cart:updated", handleCartUpdated);
    window.addEventListener("auth:login", handleAuthChanged);
    window.addEventListener("auth:logout", handleAuthChanged);

    return () => {
      isActive = false;
      window.removeEventListener("cart:updated", handleCartUpdated);
      window.removeEventListener("auth:login", handleAuthChanged);
      window.removeEventListener("auth:logout", handleAuthChanged);
      window.clearTimeout(cartAnimationTimeout.current);
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

  const handleLogoutConfirm = async () => {
    await logoutUser().catch(() => undefined);
    setCurrentUser(null);
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
            {visibleNavigationItems.map((item) => (
              <Link
                key={item.href}
                data-onboarding-target={item.href === "/" ? "home" : item.href === "/products" ? "products" : item.href === "/ar" ? "ar" : item.href === "/about-us" ? "about" : item.href === "/contact-us" ? "contact" : undefined}
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
              data-onboarding-target="cart"
              to="/cart"
              aria-label="Giỏ hàng"
              title="Giỏ hàng"
            >
              <span className={`fpt-navbar__cart-icon${cartBump ? " is-bumping" : ""}`}>
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="fpt-navbar__cart-badge" aria-hidden="true">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
            </Link>
            <div className="fpt-navbar__account" ref={accountRef}>
              {isAuthenticated ? (
                <>
                  <button
                    className="fpt-navbar__icon-link fpt-navbar__account-trigger"
                    data-onboarding-target="account"
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
                    {authenticatedAccountItems.map(
                      ({ label, href, icon: Icon }) => (
                        <Link
                          key={href}
                          to={href}
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                        >
                          <Icon size={17} aria-hidden="true" /> {label}
                        </Link>
                      ),
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogoutRequest}
                    >
                      <LogOut size={17} aria-hidden="true" /> Đăng xuất
                    </button>
                    <div className="fpt-navbar__app-version" role="presentation">
                      <span>Phiên bản {APP_VERSION}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="fpt-navbar__icon-link fpt-navbar__account-trigger"
                    data-onboarding-target="account"
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
                    <div className="fpt-navbar__app-version" role="presentation">
                      <span>Phiên bản {APP_VERSION}</span>
                    </div>
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
              {mobileOpen ? (
                <X size={24} aria-hidden="true" />
              ) : (
                <Menu size={24} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <div
          className={`fpt-navbar__mobile-drawer${mobileOpen ? " fpt-navbar__mobile-drawer--open" : ""}`}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fpt-navbar__mobile-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fpt-navbar__mobile-header">
              <h3>Điều hướng</h3>
              <button
                className="fpt-navbar__mobile-close"
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={22} />
              </button>
            </div>
            <nav
              className="fpt-navbar__mobile-nav"
              aria-label="Điều hướng mobile"
            >
              {visibleNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="fpt-navbar__mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="fpt-navbar__mobile-account">
                <Link
                  to="/cart"
                  className="fpt-navbar__mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={`fpt-navbar__cart-icon${cartBump ? " is-bumping" : ""}`}>
                    <ShoppingBag size={18} />
                    {cartCount > 0 && (
                      <span className="fpt-navbar__cart-badge" aria-hidden="true">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </span>
                  Giỏ hàng
                </Link>
                {isAuthenticated ? (
                  <>
                    {authenticatedAccountItems.map(
                      ({ label, href, icon: Icon }) => (
                        <Link
                          key={href}
                          to={href}
                          className="fpt-navbar__mobile-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Icon size={18} /> {label}
                        </Link>
                      ),
                    )}
                    <button
                      type="button"
                      className="fpt-navbar__mobile-link fpt-navbar__mobile-logout"
                      onClick={handleLogoutRequest}
                    >
                      <LogOut size={18} /> Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="fpt-navbar__mobile-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      <LogIn size={18} /> Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      className="fpt-navbar__mobile-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      <UserPlus size={18} /> Đăng ký
                    </Link>
                  </>
                )}
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
