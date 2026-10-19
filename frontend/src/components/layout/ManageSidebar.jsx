import { useEffect, useRef, useState } from "react";
import {
  Archive,
  CircleUserRound,
  FileText,
  House,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircleQuestion,
  Package,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LogoutModal from "./LogoutModal.jsx";
import "./ManageSidebar.scss";

const menuItems = [
  { label: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Người dùng", href: "/admin/users", icon: UsersRound },
  { label: "Liên hệ", href: "/admin/contacts", icon: Mail },
  { label: "Đơn hàng", href: "/admin/orders", icon: Package },
  { label: "Sản phẩm", href: "/admin/products", icon: Archive },
  { label: "Nội dung di sản", icon: FileText },
  { label: "Trải nghiệm AR", icon: Sparkles },
  { label: "Câu hỏi cộng đồng", icon: MessageCircleQuestion },
];

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

function ManageSidebar({ isCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [user, setUser] = useState(readStoredUser);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const userName = user?.fullName || user?.name || "Người quản trị";

  useEffect(() => {
    const syncUser = () => setUser(readStoredUser());
    window.addEventListener("storage", syncUser);
    window.addEventListener("auth:login", syncUser);
    window.addEventListener("auth:logout", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth:login", syncUser);
      window.removeEventListener("auth:logout", syncUser);
    };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setLogoutModalOpen(false);
    window.dispatchEvent(new Event("auth:logout"));
    toast.success("Đã đăng xuất tài khoản.");
    navigate("/login");
  };

  const handleMenuClick = (item) => {
    if (item.href) {
      navigate(item.href);
      return;
    }

    toast(`${item.label} sẽ được kết nối trong bước tiếp theo.`);
  };

  return (
    <aside
      className={`manage-sidebar${isCollapsed ? " manage-sidebar--collapsed" : ""}`}
      aria-label="Điều hướng quản trị"
    >
      <div className="manage-sidebar__user" ref={dropdownRef}>
        <button
          className="manage-sidebar__user-button"
          type="button"
          onClick={() => setAccountOpen((open) => !open)}
          aria-expanded={accountOpen}
          title={isCollapsed ? userName : undefined}
        >
          <CircleUserRound size={24} aria-hidden="true" />
          <span className="manage-sidebar__user-copy">
            <strong>{userName}</strong>
            <small>Quản trị viên</small>
          </span>
        </button>
        {accountOpen && (
          <div className="manage-sidebar__account-dropdown" role="menu">
            <p>Đang đăng nhập với vai trò quản trị viên</p>
            <button
              type="button"
              role="menuitem"
              onClick={() => navigate("/user-profile")}
            >
              <CircleUserRound size={16} aria-hidden="true" /> Tài khoản
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => navigate("/enter-old-password")}
            >
              <KeyRound size={16} aria-hidden="true" /> Đổi mật khẩu
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setLogoutModalOpen(true)}
            >
              <LogOut size={16} aria-hidden="true" /> Đăng xuất
            </button>
          </div>
        )}
      </div>

      <nav className="manage-sidebar__nav" aria-label="Điều hướng quản trị">
        <p className="manage-sidebar__nav-label">Không gian làm việc</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = item.href && location.pathname === item.href;
          return (
            <button
              className={`manage-sidebar__item${active ? " manage-sidebar__item--active" : ""}`}
              key={item.label}
              type="button"
              onClick={() => handleMenuClick(item)}
              title={isCollapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="manage-sidebar__footer">
        <button
          className="manage-sidebar__back-link"
          type="button"
          onClick={() => navigate("/")}
        >
          <House size={17} aria-hidden="true" />
          <span>Về trang chủ</span>
        </button>
      </div>

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </aside>
  );
}

export default ManageSidebar;
