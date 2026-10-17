import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import coverImage from "../../assets/pics/auth_cover.png";
import "./LoginPage.scss";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      toast("Kết nối đăng nhập sẽ được tích hợp trong bước tiếp theo.");
    }, 700);
  };

  const handleGoogleLogin = () => {
    toast("Đăng nhập Google sẽ được tích hợp trong bước tiếp theo.");
  };

  return (
    <main className="login-page" aria-label="Đăng nhập Chạm Sắc Việt">
      <section className="login-page__form-pane">
        <div className="login-page__content">
          <header className="login-page__heading">
            {/* <p className="login-page__eyebrow">Chạm Sắc Việt</p> */}
            <h1>Đăng nhập</h1>
            <p>Chào mừng bạn trở lại với hành trình khám phá di sản.</p>
          </header>

          <Card className="login-page__card">
            <form onSubmit={handleSubmit}>
              <label className="login-page__label" htmlFor="login-email">
                Email
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />

              <label className="login-page__label" htmlFor="login-password">
                Mật khẩu
              </label>
              <div className="login-page__password-field">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu của bạn"
                  required
                />
                <button
                  type="button"
                  className="login-page__password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff size={19} aria-hidden="true" />
                  ) : (
                    <Eye size={19} aria-hidden="true" />
                  )}
                </button>
              </div>

              <Button
                className="login-page__submit"
                type="submit"
                size="lg"
                loading={loading}
              >
                Đăng nhập
              </Button>
              <Link className="login-page__forgot" to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </form>
          </Card>

          <p className="login-page__or">Hoặc</p>
          <Button
            className="login-page__google-button"
            variant="secondary"
            type="button"
            icon={<GoogleIcon />}
            onClick={handleGoogleLogin}
          >
            Đăng nhập với Google
          </Button>

          <p className="login-page__register">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
          <Link className="login-page__home" to="/">
            Về trang chủ
          </Link>
        </div>
      </section>

      <aside
        className="login-page__cover"
        style={{ backgroundImage: `url(${coverImage})` }}
        aria-label="Ảnh minh họa văn hóa Việt Nam"
      />
    </main>
  );
};

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.25Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.5Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.59A5.85 5.85 0 0 1 6.23 12c0-.55.11-1.09.31-1.59V7.89H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.11l3.24-2.52Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.46 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.52c.77-2.31 2.92-4.03 5.46-4.03Z"
      />
    </svg>
  );
}

export default LoginPage;
