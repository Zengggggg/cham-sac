import React, { useEffect, useRef, useState } from "react";
import { Bell, Languages, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import useTheme from "../hooks/use-theme";
import { useManageSidebar } from "../contexts/manage-sidebar-context";
import "./ManageHeader.scss";

const LANGUAGE_OPTIONS = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
];

const ManageHeader = () => {
  const { i18n, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const componentText = (key, options) => t(`components.${key}`, options);
  const language = LANGUAGE_OPTIONS.some(({ code }) => code === i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : "vi";
  const { isSidebarCollapsed, toggleSidebar } = useManageSidebar();
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => Number(localStorage.getItem("staffChatUnreadCount") || 0));
  const languageMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { const syncUnread = () => setUnreadCount(Number(localStorage.getItem("staffChatUnreadCount") || 0)); window.addEventListener("staff-chat:unread", syncUnread); return () => window.removeEventListener("staff-chat:unread", syncUnread); }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!languageMenuRef.current?.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsLanguageMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLanguageChange = async (nextLanguage) => {
    if (isLanguageChanging || nextLanguage === language) {
      setIsLanguageMenuOpen(false);
      return;
    }

    setIsLanguageMenuOpen(false);
    setIsLanguageChanging(true);
    const loadingToast = toast.loading(componentText("changingLanguage"));

    await new Promise((resolve) => window.setTimeout(resolve, 2000));

    try {
      await i18n.changeLanguage(nextLanguage);
      toast.success(i18n.t("components.languageChanged"), { id: loadingToast });
    } catch {
      toast.error(i18n.t("components.languageChangeError"), { id: loadingToast });
    } finally {
      setIsLanguageChanging(false);
    }
  };

  const handleThemeChange = async () => {
    if (isThemeChanging) return;

    setIsThemeChanging(true);
    const mode = theme === "light"
      ? componentText("themeDark")
      : componentText("themeLight");
    const loadingToast = toast.loading(componentText("changingTheme", { mode }));

    await new Promise((resolve) => window.setTimeout(resolve, 2000));

    try {
      toggleTheme();
      toast.success(componentText("themeChanged", { mode }), { id: loadingToast });
    } catch {
      toast.error(componentText("themeChangeError"), { id: loadingToast });
    } finally {
      setIsThemeChanging(false);
    }
  };

  return (
    <>
      <header className={`manage-header ${isSidebarCollapsed ? "manage-header--sidebar-collapsed" : ""}`}>
        <button className="manage-header__menu-button" type="button" aria-label={componentText(isSidebarCollapsed ? "expandSidebar" : "collapseSidebar")} aria-expanded={!isSidebarCollapsed} onClick={toggleSidebar}>
          <Menu size={21} />
        </button>
        <p className="manage-header__title">{componentText("manageTitle")}</p>
        <div className="manage-header__actions">
          <div className="manage-header__language" ref={languageMenuRef}>
            <button
              className="manage-header__action-button"
              type="button"
              aria-label={t("header.selectLanguage", { defaultValue: "Select language" })}
              title={t("header.selectLanguage", { defaultValue: "Select language" })}
              aria-busy={isLanguageChanging}
              aria-expanded={isLanguageMenuOpen}
              aria-haspopup="listbox"
              disabled={isLanguageChanging}
              onClick={() => setIsLanguageMenuOpen((isOpen) => !isOpen)}
            >
              <Languages size={24} strokeWidth={1.6} aria-hidden="true" />
            </button>
            {isLanguageMenuOpen && (
              <div
                className="manage-header__language-menu"
                role="listbox"
                aria-label={t("header.selectLanguage", { defaultValue: "Select language" })}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    role="option"
                    aria-selected={language === option.code}
                    className={`manage-header__language-option${language === option.code ? " manage-header__language-option--active" : ""}`}
                    disabled={isLanguageChanging}
                    onClick={() => handleLanguageChange(option.code)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="manage-header__action-button"
            type="button"
            aria-label={theme === "light" ? t("header.darkMode") : t("header.lightMode")}
            title={theme === "light" ? t("header.darkMode") : t("header.lightMode")}
            onClick={handleThemeChange}
            disabled={isThemeChanging}
            aria-busy={isThemeChanging}
          >
            {theme === "light" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </button>
          <button className="manage-header__notification" type="button" aria-label={componentText("unreadMessages")} onClick={() => { localStorage.setItem("staffChatUnreadCount", "0"); setUnreadCount(0); navigate(location.pathname.startsWith("/admin") ? "/admin/chat" : "/staff/chat"); }}><Bell size={21} />{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>
        </div>
      </header>
    </>
  );
};

export default ManageHeader;
