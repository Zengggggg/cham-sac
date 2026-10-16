import React, { useEffect, useState } from "react";
import "./ContactUsPage.css";
import contactCover from "../../assets/hero.png";
// import axiosClient from "../../apis/axiosClient";
// import { translateError, translateSuccess } from "../../utils/translateResponse";
import toast from "react-hot-toast";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Dices, Ghost, Mail, MapPin, Phone } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
// import { useTranslation } from "react-i18next";

const copy = {
  title: "Liên hệ với chúng tôi", heading: "Gửi lời nhắn", description: "Hãy để lại thông tin, chúng tôi sẽ phản hồi sớm nhất.", email: "Email", emailValue: "fptuhalloween@fpt.edu.vn", emailLabel: "Email liên hệ", name: "Họ và tên", phone: "Số điện thoại", subject: "Chủ đề", content: "Nội dung", submit: "Gửi liên hệ", sending: "Đang gửi...", mapTitle: "Bản đồ Đại học FPT", fanpage: "Fanpage", halloweenPage: "FPTU Halloween", clubPage: "FPTU Board Game Club", address: "Địa chỉ", university: "Đại học FPT - Khu CNC Hòa Lạc", organizer: "Ban tổ chức", organizerContact: "Liên hệ ban tổ chức", communications: "Truyền thông", communicationsContact: "Liên hệ truyền thông",
  required: ({ field }) => `${field} không được để trống`, invalid: ({ field }) => `${field} không hợp lệ`,
};

function ContactUsPage() {
  // const { t, i18n } = useTranslation();
  const contact = (key, options) => typeof copy[key] === "function" ? copy[key](options) : copy[key] || key;
  /* const phoneCopiedMessage = {
    vi: "Đã sao chép số điện thoại",
    en: "Phone number copied",
    ja: "電話番号をコピーしました",
  }[i18n.resolvedLanguage] || "Phone number copied"; */
  const phoneCopiedMessage = "Đã sao chép số điện thoại";
  const contactEmail = contact("emailValue");
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`;
  const [formData, setFormData] = useState({
    receiverName: "",
    phone: "",
    email: "",
    topic: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  const copyPhoneNumber = async (phoneNumber) => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      toast.success(phoneCopiedMessage);
    } catch {
      toast.error(contact("invalid", { field: contact("phone") }));
    }
  };

  const handlePhoneCardKeyDown = (event, phoneNumber) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      copyPhoneNumber(phoneNumber);
    }
  };

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user)
        setFormData((prev) => ({
          ...prev,
          receiverName: user.fullName || user.name || "",
          phone: user.phone || "",
          email: user.email || "",
        }));
    } catch {
      // Keep the form empty when local user data is invalid.
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.receiverName.trim()) {
      newErrors.name = contact("required", { field: contact("name") });
    }

    if (!formData.phone.trim()) {
      newErrors.phone_number = contact("required", { field: contact("phone") });
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone_number = contact("invalid", { field: contact("phone") });
    }

    if (!formData.email.trim()) {
      newErrors.email = contact("required", { field: contact("email") });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = contact("invalid", { field: contact("email") });
    }

    if (!formData.topic.trim()) {
      newErrors.subject = contact("required", { field: contact("subject") });
    }

    if (!formData.message.trim()) {
      newErrors.content = contact("required", { field: contact("content") });
    }

    if (newErrors.name) newErrors.receiverName = newErrors.name;
    if (newErrors.phone_number) newErrors.phone = newErrors.phone_number;
    if (newErrors.subject) newErrors.topic = newErrors.subject;
    if (newErrors.content) newErrors.message = newErrors.content;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const loadingToast = toast.loading(contact("sending"));
    try {
      // API submit được comment để tích hợp sau:
      // const response = await axiosClient.post("/contacts", formData);
      // toast.success(translateSuccess(response.data.message), { id: loadingToast });
      toast.success("Thông tin đã được ghi nhận", { id: loadingToast });
      setFormData((prev) => ({ ...prev, topic: "", message: "" }));
      setErrors({});
    } catch {
      toast.error("Không thể xử lý thông tin", { id: loadingToast });
    }
    return;
  };

  return (
    <div className="fptu-halloween-contact-page">
      {/* Header */}
      <header
        className="fptu-halloween-contact-header"
        style={{ backgroundImage: `url(${contactCover})` }}
      >
        <div className="fptu-halloween-contact-banner">
          <h1 className="fptu-halloween-contact-banner-title">
            {contact("title")}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="fptu-halloween-contact-main">
        <div className="fptu-halloween-contact-container">
          {/* Left Section - Feedback Form */}
          <div className="fptu-halloween-contact-form-section">
            <Card className="fptu-halloween-contact-form-card">
              <h2 className="fptu-halloween-contact-form-title">
                {contact("heading")}
              </h2>
              <p className="fptu-halloween-contact-form-description">
                {contact("description")}
              </p>

              <div className="fptu-halloween-contact-social">
                <button
                  onClick={() =>
                    window.open(
                      "https://www.facebook.com/fptuhalloween",
                      "_blank",
                    )
                  }
                  className="fpt-header__social-btn fpt-header__social-btn--facebook"
                >
                  <FacebookIcon />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      "https://www.facebook.com/fuboardgameclub",
                      "_blank",
                    )
                  }
                  className="fpt-header__social-btn fpt-header__social-btn--tiktok"
                >
                  <InstagramIcon />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      "https://www.tiktok.com/@fptu.halloween2025",
                      "_blank",
                    )
                  }
                  className="fpt-header__social-btn fpt-header__social-btn--youtube"
                >
                  <YouTubeIcon />
                </button>
                {/* <p className="fptu-halloween-contact-google-form-text">
                  Hoặc gửi ý kiến, phản hồi qua Google Form
                </p>
                <button className="fptu-halloween-contact-google-form-btn">
                  Google Form
                </button> */}
              </div>

              <form
                onSubmit={handleSubmit}
                className="fptu-halloween-contact-form"
              >
                <div className="fptu-halloween-contact-form-fields">
                  <div className="fptu-halloween-contact-form-group">
                    <input
                      type="text"
                      name="receiverName"
                      aria-label={contact("name")}
                      placeholder={contact("name")}
                      value={formData.receiverName}
                      onChange={handleInputChange}
                      className={`fptu-halloween-contact-form-input ${
                        errors.receiverName
                          ? "fptu-halloween-contact-form-input-error"
                          : ""
                      }`}
                    />
                    {errors.name && (
                      <span className="fptu-halloween-contact-form-error">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div className="fptu-halloween-contact-form-group">
                    <input
                      type="tel"
                      name="phone"
                      aria-label={contact("phone")}
                      placeholder={contact("phone")}
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`fptu-halloween-contact-form-input ${
                        errors.phone
                          ? "fptu-halloween-contact-form-input-error"
                          : ""
                      }`}
                    />
                    {errors.phone_number && (
                      <span className="fptu-halloween-contact-form-error">
                        {errors.phone_number}
                      </span>
                    )}
                  </div>

                  <div className="fptu-halloween-contact-form-group">
                    <input
                      type="email"
                      name="email"
                      aria-label={contact("email")}
                      placeholder={contact("email")}
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`fptu-halloween-contact-form-input ${errors.email ? "fptu-halloween-contact-form-input-error" : ""}`}
                    />
                    {errors.email && (
                      <span className="fptu-halloween-contact-form-error">
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="fptu-halloween-contact-form-group">
                    <input
                      type="text"
                      name="topic"
                      aria-label={contact("subject")}
                      placeholder={contact("subject")}
                      value={formData.topic}
                      onChange={handleInputChange}
                      className={`fptu-halloween-contact-form-input ${
                        errors.topic
                          ? "fptu-halloween-contact-form-input-error"
                          : ""
                      }`}
                    />
                    {errors.subject && (
                      <span className="fptu-halloween-contact-form-error">
                        {errors.subject}
                      </span>
                    )}
                  </div>

                  <div className="fptu-halloween-contact-form-group">
                    <textarea
                      name="message"
                      aria-label={contact("content")}
                      placeholder={contact("content")}
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className={`fptu-halloween-contact-form-textarea ${
                        errors.message
                          ? "fptu-halloween-contact-form-input-error"
                          : ""
                      }`}
                    />
                    {errors.content && (
                      <span className="fptu-halloween-contact-form-error">
                        {errors.content}
                      </span>
                    )}
                  </div>
                </div>

                <Button type="submit" className="fptu-halloween-contact-form-submit">
                  {contact("submit")}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Section - Map and Contact Info */}
          <div className="fptu-halloween-contact-info-section">
            <div className="fptu-halloween-contact-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2218.7988692920785!2d105.52420295348495!3d21.01218777371515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135abc60e7d3f19%3A0x2be9d7d0b5abcbf4!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgSMOgIE7hu5lp!5e1!3m2!1svi!2s!4v1760409563114!5m2!1svi!2s"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={contact("mapTitle")}
                className="fptu-halloween-contact-map-iframe"
              ></iframe>
            </div>

            <div className="fptu-halloween-contact-info-cards">
              <a
                className="fptu-halloween-contact-info-card"
                href="https://www.facebook.com/fptuhalloween"
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className="fptu-halloween-contact-info-icon"
                  aria-hidden="true"
                >
                  <Ghost size={24} />
                </div>
                <div className="fptu-halloween-contact-info-content">
                  <h3 className="fptu-halloween-contact-info-title">{contact("fanpage")}</h3>
                  <p className="fptu-halloween-contact-info-text">
                    {contact("halloweenPage")}
                  </p>
                </div>
              </a>
              <a
                className="fptu-halloween-contact-info-card"
                href="https://www.facebook.com/fuboardgameclub"
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className="fptu-halloween-contact-info-icon"
                  aria-hidden="true"
                >
                  <Dices size={24} />
                </div>
                <div className="fptu-halloween-contact-info-content">
                  <h3 className="fptu-halloween-contact-info-title">{contact("fanpage")}</h3>
                  <p className="fptu-halloween-contact-info-text">
                    {contact("clubPage")}
                  </p>
                </div>
              </a>
              <a
                className="fptu-halloween-contact-info-card"
                href="https://maps.app.goo.gl/LzyaNJFQpxyvtAYq5"
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className="fptu-halloween-contact-info-icon"
                  aria-hidden="true"
                >
                  <MapPin size={24} />
                </div>
                <div className="fptu-halloween-contact-info-content">
                  <h3 className="fptu-halloween-contact-info-title">{contact("address")}</h3>
                  <p className="fptu-halloween-contact-info-text">
                    {contact("university")}
                  </p>
                </div>
              </a>
              <a
                className="fptu-halloween-contact-info-card"
                href={gmailUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className="fptu-halloween-contact-info-icon"
                  aria-hidden="true"
                >
                  <Mail size={24} />
                </div>
                <div className="fptu-halloween-contact-info-content">
                  <h3 className="fptu-halloween-contact-info-title">{contact("emailLabel")}</h3>
                  <p className="fptu-halloween-contact-info-text">
                    {contact("emailValue")}
                  </p>
                </div>
              </a>
              <div
                className="fptu-halloween-contact-info-card fptu-halloween-contact-info-card--copyable"
                role="button"
                tabIndex={0}
                onClick={() => copyPhoneNumber("0338263886")}
                onKeyDown={(event) => handlePhoneCardKeyDown(event, "0338263886")}
              >
                <div
                  className="fptu-halloween-contact-info-icon"
                  aria-hidden="true"
                >
                  <Phone size={24} />
                </div>
                <div className="fptu-halloween-contact-info-content">
                  <h3 className="fptu-halloween-contact-info-title">
                    {contact("organizer")}
                  </h3>
                  <p className="fptu-halloween-contact-info-text">
                    {contact("organizerContact")}
                  </p>
                </div>
              </div>

              <div
                className="fptu-halloween-contact-info-card fptu-halloween-contact-info-card--copyable"
                role="button"
                tabIndex={0}
                onClick={() => copyPhoneNumber("0947319889")}
                onKeyDown={(event) => handlePhoneCardKeyDown(event, "0947319889")}
              >
                <div
                  className="fptu-halloween-contact-info-icon"
                  aria-hidden="true"
                >
                  <Phone size={24} />
                </div>
                <div className="fptu-halloween-contact-info-content">
                  <h3 className="fptu-halloween-contact-info-title">
                    {contact("communications")}
                  </h3>
                  <p className="fptu-halloween-contact-info-text">
                    {contact("communicationsContact")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ContactUsPage;
