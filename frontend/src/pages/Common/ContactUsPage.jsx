import { useState } from "react";
import {
  ArrowUpRight,
  Ghost,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import FloatingCharacter from "../../components/layout/FloatingCharacter.jsx";
import elementStar from "../../assets/elements/IMG_4811.PNG";
import elementTealFold from "../../assets/elements/IMG_4822.PNG";
import "./ContactUsPage.css";

const initialForm = {
  receiverName: "",
  phone: "",
  email: "",
  topic: "",
  message: "",
};

function getInitialForm() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user
      ? {
          ...initialForm,
          receiverName: user.fullName || user.name || "",
          phone: user.phone || "",
          email: user.email || "",
        }
      : initialForm;
  } catch {
    return initialForm;
  }
}

const contactLinks = [
  {
    icon: Ghost,
    title: "Fanpage",
    text: "Chạm Sắc Việt",
    href: "https://www.facebook.com/61592108695547",
  },
  {
    icon: MapPin,
    title: "Địa chỉ",
    text: "Đại học FPT Hà Nội",
    href: "https://maps.app.goo.gl/LzyaNJFQpxyvtAYq5",
  },
  {
    icon: Mail,
    title: "Email liên hệ",
    text: "chamsacviet@gmail.com",
    href: "mailto:chamsacviet@gmail.com",
  },
  {
    icon: Mail,
    title: "Email liên hệ",
    text: "chamsacviet@gmail.com",
    href: "mailto:chamsacviet@gmail.com",
  },
];

const phoneLinks = [
  { title: "Hotline", text: "0374385234", phone: "0374385234" },
  { title: "Hotline", text: "0374385234", phone: "0374385234" },
];

export default function ContactUsPage() {
  const [formData, setFormData] = useState(getInitialForm);
  const [errors, setErrors] = useState({});

  const updateField = ({ target }) => {
    setFormData((current) => ({ ...current, [target.name]: target.value }));
    setErrors((current) => ({ ...current, [target.name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.receiverName.trim())
      nextErrors.receiverName = "Họ và tên không được để trống.";
    if (!formData.phone.trim())
      nextErrors.phone = "Số điện thoại không được để trống.";
    else if (!/^[0-9+\-\s()]+$/.test(formData.phone))
      nextErrors.phone = "Số điện thoại không hợp lệ.";
    if (!formData.email.trim()) nextErrors.email = "Email không được để trống.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      nextErrors.email = "Email không hợp lệ.";
    if (!formData.topic.trim())
      nextErrors.topic = "Chủ đề không được để trống.";
    if (!formData.message.trim())
      nextErrors.message = "Nội dung không được để trống.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    toast.success("Thông tin đã được ghi nhận");
    setFormData((current) => ({ ...current, topic: "", message: "" }));
  };

  const copyPhone = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Đã sao chép số điện thoại");
    } catch {
      toast.error("Không thể sao chép số điện thoại");
    }
  };

  return (
    <main className="contact-page">
      <img className="contact-page__element contact-page__element--teal" src={elementTealFold} alt="" aria-hidden="true" />
      <img className="contact-page__element contact-page__element--star" src={elementStar} alt="" aria-hidden="true" />
      <div className="contact-page__shell">
        <header className="contact-page__hero">
          <FloatingCharacter variant={1} className="contact-page__character" />
          <p className="contact-page__eyebrow">
            <Mail size={16} aria-hidden="true" /> KẾT NỐI CÙNG CHẠM SẮC VIỆT
          </p>
          <h1>Liên hệ với chúng tôi</h1>
          <p>Hãy để lại thông tin, chúng tôi sẽ phản hồi sớm nhất.</p>
        </header>

        <div className="contact-page__layout">
          <Card
            className="contact-page__form-card"
            title="Gửi lời nhắn"
            description="Chia sẻ câu hỏi hoặc góp ý của bạn với đội ngũ Chạm Sắc Việt."
          >
            <div className="contact-page__socials" aria-label="Mạng xã hội">
              <a
                className="contact-page__social-link contact-page__social-link--facebook"
                href="https://www.facebook.com/61592108695547"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                title="Facebook"
              >
                <FacebookIcon fontSize="small" />
              </a>
              <a
                className="contact-page__social-link contact-page__social-link--instagram"
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <InstagramIcon fontSize="small" />
              </a>
              <a
                className="contact-page__social-link contact-page__social-link--youtube"
                href="https://www.youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                title="YouTube"
              >
                <YouTubeIcon fontSize="small" />
              </a>
            </div>
            <form
              className="contact-page__form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="contact-page__fields">
                <Field
                  label="Họ và tên"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={updateField}
                  error={errors.receiverName}
                />
                <Field
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={updateField}
                  error={errors.phone}
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={updateField}
                  error={errors.email}
                />
                <Field
                  label="Chủ đề"
                  name="topic"
                  value={formData.topic}
                  onChange={updateField}
                  error={errors.topic}
                />
                <label className="contact-page__field contact-page__field--wide">
                  Nội dung
                  <textarea
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={updateField}
                    placeholder="Bạn muốn chia sẻ điều gì?"
                    aria-invalid={Boolean(errors.message)}
                  />
                  {errors.message && <small>{errors.message}</small>}
                </label>
              </div>
              <Button
                type="submit"
                icon={<Send size={17} aria-hidden="true" />}
              >
                Gửi liên hệ
              </Button>
            </form>
          </Card>

          <section
            className="contact-page__aside"
            aria-label="Thông tin liên hệ"
          >
            <Card className="contact-page__map-card">
              <div className="contact-page__map">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2218.7988692920785!2d105.52420295348495!3d21.01218777371515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135abc60e7d3f19%3A0x2be9d7d0b5abcbf4!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgSMOgIE7hu5lp!5e1!3m2!1svi!2s!4v1760409563114!5m2!1svi!2s"
                  title="Bản đồ Đại học FPT"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Card>
            <div className="contact-page__info-grid">
              {contactLinks.map(({ icon: Icon, title, text, href }) => (
                <a
                  className="contact-page__info-card"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  key={`${title}-${text}`}
                >
                  <span>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              ))}
              {phoneLinks.map(({ title, text, phone }) => (
                <button
                  className="contact-page__info-card contact-page__info-card--copyable"
                  type="button"
                  onClick={() => copyPhone(phone)}
                  key={title}
                >
                  <span>
                    <Phone size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* <p className="contact-page__back"><Link to="/"><ArrowUpRight size={15} aria-hidden="true" /> Về trang chủ</Link></p> */}
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", value, onChange, error }) {
  return (
    <label className="contact-page__field">
      {label}
      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={`Nhập ${label.toLowerCase()}`}
        aria-invalid={Boolean(error)}
      />
      {error && <small>{error}</small>}
    </label>
  );
}
