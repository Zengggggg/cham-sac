import { useState } from "react";
import { Info, Menu } from "lucide-react";
import SoftwareInfoModal from "./SoftwareInfoModal.jsx";
import "./ManageHeader.scss";

function ManageHeader({ isSidebarCollapsed, onToggleSidebar }) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  return (
    <header className="manage-header">
      <button
        className="manage-header__menu-button"
        type="button"
        onClick={onToggleSidebar}
        aria-label={
          isSidebarCollapsed ? "Mở thanh quản trị" : "Thu gọn thanh quản trị"
        }
        aria-expanded={!isSidebarCollapsed}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="manage-header__title-group">
        <p className="manage-header__title">
          Hệ thống quản trị Dự án Chạm Sắc Việt
        </p>
      </div>

      <div className="manage-header__actions">
        <button
          className="manage-header__action-button"
          type="button"
          onClick={() => setIsInfoModalOpen(true)}
          aria-label="Thông tin phần mềm và nhà phát triển"
          title="Thông tin phần mềm và nhà phát triển"
        >
          <Info size={22} aria-hidden="true" />
        </button>
      </div>

      <SoftwareInfoModal
        open={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </header>
  );
}

export default ManageHeader;
