import React from "react";
import {
  BadgeCheck,
  ClipboardPenLine,
  CircleUserRound,
  ContactRound,
  Home,
  KeyRound,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  MessagesSquare,
  Newspaper,
  ReceiptText,
  Tags,
  TicketCheck,
  Tickets,
  UsersRound,
  Vote,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "../apis/authAPI";
import LogoutModal from "./LogoutModal";
import toast from "react-hot-toast";
import { translateSuccess } from "../utils/translateResponse";
import { useManageSidebar } from "../contexts/manage-sidebar-context";
import "./ManageSidebar.scss";
import avatar from "../assets/avatar.jpg";

const MENU_BY_ROLE = {
  admin: [
    { id: "dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { id: "chat", labelKey: "chat", icon: MessagesSquare },
    { id: "check-in", labelKey: "checkIn", icon: BadgeCheck },
    { id: "users", labelKey: "users", icon: UsersRound },
    { id: "ticket-types", labelKey: "ticketTypes", icon: TicketCheck },
    {
      id: "purchased-tickets",
      labelKey: "purchasedTickets",
      icon: Tickets,
    },
    { id: "orders", labelKey: "orders", icon: ReceiptText },
    { id: "contacts", labelKey: "contacts", icon: ContactRound },
    { id: "hot-news", labelKey: "hotNews", icon: Megaphone },
    { id: "facebook-news", labelKey: "facebookNews", icon: Newspaper },
    { id: "feedback", labelKey: "feedbackManagement", icon: ClipboardPenLine },
    { id: "vote", labelKey: "ddayVote", icon: Vote },
    { id: "lucky-draw", labelKey: "luckyDraw", icon: Gift },
    { id: "home", labelKey: "eventHome", icon: Home },
  ],
  staff: [
    { id: "dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { id: "chat", labelKey: "chat", icon: MessagesSquare },
    { id: "ticket-types", labelKey: "ticketTypes", icon: TicketCheck },
    { id: "purchased-tickets", labelKey: "purchasedTickets", icon: Tickets },
    { id: "check-in", labelKey: "checkIn", icon: BadgeCheck },
    { id: "feedback", labelKey: "feedback", icon: ClipboardPenLine },
    { id: "home", labelKey: "eventHome", icon: Home },
  ],
};

const getRoleName = (user) =>
  user?.role?.roleName ||
  user?.roleName ||
  user?.role ||
  user?.roleId?.roleName ||
  user?.roleId;

const normalizeRole = (role) =>
  String(role || "staff")
    .trim()
    .toLowerCase() === "admin"
    ? "admin"
    : "staff";

const ManageSidebar = ({ role, activeItem = "dashboard", onNavigate }) => {
  const { t } = useTranslation();
  const componentText = (key, options) => t(`components.${key}`, options);
  const navigate = useNavigate();
  const { isSidebarCollapsed, toggleSidebar } = useManageSidebar();
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const resolvedRole = normalizeRole(getRoleName(user) || role);

  React.useEffect(() => {
    const syncUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", syncUser);
    window.addEventListener("auth:login", syncUser);
    window.addEventListener("auth:logout", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth:login", syncUser);
      window.removeEventListener("auth:logout", syncUser);
    };
  }, []);

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    setShowDropdown(false);
    setShowLogoutModal(false);
    toast.success(translateSuccess("Logout successful"));
    navigate("/");
  };

  const userName = user?.fullName || user?.name || componentText("you");

  const menuItems = MENU_BY_ROLE[resolvedRole] || MENU_BY_ROLE.staff;
  const defaultRoutes = {
    dashboard:
      resolvedRole === "admin" ? "/admin/dashboard" : "/staff/dashboard",
    chat: resolvedRole === "admin" ? "/admin/chat" : "/staff/chat",
    "check-in":
      resolvedRole === "admin" ? "/admin/check-in" : "/staff/check-in",
    users: "/admin/users",
    orders: "/admin/orders",
    contacts: "/admin/contacts",
    "hot-news": "/admin/hot-news",
    "facebook-news": "/admin/facebook-news",
    "ticket-types":
      resolvedRole === "admin" ? "/admin/tickets" : "/staff/ticket-types",
    feedback: resolvedRole === "admin" ? "/admin/feedback" : "/staff/feedback",
    vote: "/admin/votes",
    "lucky-draw": "/admin/lucky-draw",
    "purchased-tickets":
      resolvedRole === "admin"
        ? "/admin/purchased-tickets"
        : "/staff/purchased-tickets",
    home: "/",
  };

  return (
    <aside
      className={`manage-sidebar ${isSidebarCollapsed ? "manage-sidebar--collapsed" : ""}`}
      aria-label={componentText("manageNavigation")}
    >
      <div className="manage-sidebar__brand">
        <img
          className="manage-sidebar__avatar"
          src={avatar}
          alt={componentText("avatarAlt")}
        />
        <div className="manage-sidebar__brand-copy">
          <strong>{componentText("eventBrand")}</strong>
          <span>
            {componentText(resolvedRole === "admin" ? "admin" : "staff")}
          </span>
        </div>
        <button
          className="manage-sidebar__collapse-old"
          type="button"
          onClick={toggleSidebar}
          aria-expanded={!isSidebarCollapsed}
          aria-label={componentText(
            isSidebarCollapsed ? "expandSidebar" : "collapseSidebar",
          )}
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="manage-sidebar__nav">
        {menuItems.map(({ id, labelKey, icon: Icon }) => (
          <button
            className={`manage-sidebar__item ${activeItem === id ? "manage-sidebar__item--active" : ""}`}
            key={id}
            type="button"
            onClick={() =>
              onNavigate ? onNavigate(id) : navigate(defaultRoutes[id])
            }
            aria-current={activeItem === id ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={1.9} />
            <span>{componentText(labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="manage-sidebar__account" ref={dropdownRef}>
        <button
          className="manage-sidebar__account-button"
          type="button"
          onClick={() => setShowDropdown((value) => !value)}
          aria-expanded={showDropdown}
        >
          <CircleUserRound size={21} />
          <span>
            <strong>{userName}</strong>
            <small>{componentText(resolvedRole === "admin" ? "admin" : "staff")}</small>
          </span>
        </button>
        {showDropdown && (
          <div className="manage-sidebar__account-dropdown">
            <div className="manage-sidebar__account-greeting">
              <CircleUserRound size={17} />
              <span>{componentText("greeting", { name: userName })}</span>
            </div>
            <button type="button" onClick={() => navigate("/user-profile")}>
              <CircleUserRound size={16} /> {componentText("yourAccount")}
            </button>
            <button type="button" onClick={() => navigate("/change-password")}>
              <KeyRound size={16} /> {componentText("changePassword")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDropdown(false);
                setShowLogoutModal(true);
              }}
            >
              <LogOut size={16} /> {componentText("logout")}
            </button>
          </div>
        )}
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isManagement
      />
    </aside>
  );
};

export default ManageSidebar;
