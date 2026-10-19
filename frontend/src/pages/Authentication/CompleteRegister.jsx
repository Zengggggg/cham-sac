import { ArrowRight, CheckCircle2, House } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import wtmLogo from "../../assets/wtm.png";
import "./CompleteRegister.scss";

export default function CompleteRegister() {
  return (
    <main className="complete-register-page" aria-label="Đăng ký thành công">
      <section className="complete-register-page__form-pane">
        <div className="complete-register-page__content">
          <img
            className="complete-register-page__logo"
            src={wtmLogo}
            alt="Logo Chạm Sắc Việt"
          />

          <header className="complete-register-page__heading">
            <p className="complete-register-page__eyebrow">HOÀN TẤT ĐĂNG KÝ</p>
            <h1>Đăng ký thành công</h1>
            <p>Tài khoản của bạn đã sẵn sàng.</p>
          </header>

          <Card className="complete-register-page__card">
            <div
              className="complete-register-page__success-mark"
              aria-hidden="true"
            >
              <CheckCircle2 size={34} strokeWidth={2.2} />
            </div>
            <h2>Chào mừng bạn đến với Chạm Sắc Việt!</h2>
            <p>
              Hãy đăng nhập để tiếp tục khám phá những câu chuyện văn hóa và di
              sản Việt Nam.
            </p>

            <div className="complete-register-page__actions">
              <Button
                as={Link}
                to="/login"
                icon={<ArrowRight size={18} aria-hidden="true" />}
                iconPosition="right"
              >
                Đến trang đăng nhập
              </Button>
              <Button
                as={Link}
                to="/"
                variant="secondary"
                icon={<House size={18} aria-hidden="true" />}
              >
                Về trang chủ
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
