import React from "react";
import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";
import ManageSidebar from "./ManageSidebar";
import "./ManagePlaceholder.scss";

const ManagePlaceholder = ({ role = "staff", activeItem = "dashboard", title, description }) => {
  const { t } = useTranslation();
  return <div className="manage-placeholder-layout">
    <ManageSidebar role={role} activeItem={activeItem} />
    <main className="manage-placeholder">
      <section className="manage-placeholder__card">
        <div className="manage-placeholder__icon" aria-hidden="true">
          <Construction size={30} />
        </div>
        <p className="manage-placeholder__kicker">{t("components.system")}</p>
        <h1>{title}</h1>
        <p className="manage-placeholder__description">{description}</p>
        <span className="manage-placeholder__status">{t("components.developing")}</span>
      </section>
    </main>
  </div>;
};

export default ManagePlaceholder;
