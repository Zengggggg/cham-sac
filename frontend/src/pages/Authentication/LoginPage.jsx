import { useCallback, useState } from "react";
import { Eye, EyeOff, House } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton.jsx";
import coverImage from "../../assets/pics/auth_cover.png";
import { loginUser, loginWithGoogle } from "../../services/authService.js";
import "./LoginPage.scss";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const completeLogin = useCallback(
    (response) => {
      const user = response.data.user;
      toast.success(response.message || "Đăng nhập thành công.");
      navigate(user.role === "admin" ? "/admin/dashboard" : "/");
    },
    [navigate],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      completeLogin(response);
    } catch (error) {
      toast.error(error.message || "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (credentialResponse) => {
      if (!credentialResponse?.credential) {
        toast.error("Google không trả về thông tin đăng nhập hợp lệ.");
        return;
      }

      setGoogleLoading(true);
      try {
        const response = await loginWithGoogle(credentialResponse.credential);
        completeLogin(response);
      } catch (error) {
        toast.error(error.message || "Không thể đăng nhập bằng Google.");
      } finally {
        setGoogleLoading(false);
      }
    },
    [completeLogin],
  );

  return (
    <main className="login-page" aria-label="Đăng nhập Chạm Sắc Việt">
      <section className="login-page__form-pane">
        <div className="login-page__content">
          <header className="login-page__heading">
            <p className="login-page__eyebrow">Chạm Sắc Việt</p>
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
                disabled={googleLoading}
              >
                Đăng nhập
              </Button>
              <Link className="login-page__forgot" to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </form>
          </Card>

          <p className="login-page__or">Hoặc</p>
          <GoogleSignInButton
            disabled={loading || googleLoading}
            onCredential={handleGoogleCredential}
          />

          <p className="login-page__register">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
          <Link className="login-page__home" to="/">
            <House size={16} aria-hidden="true" />
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

export default LoginPage;
