import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
// import {
//   registerUser,
//   resendVerificationOtp,
//   verifyEmail,
// } from "../../services/authService.js";
import wtmLogo from "../../assets/wtm.png";
import "./ConfirmEmail.scss";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ConfirmEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const registration = location.state?.registration || {};
  // Hiện card xác nhận email trước, sau đó mới chuyển sang card OTP.
  const [step, setStep] = useState("email");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [otpError, setOtpError] = useState("");

  const email = registration.email || "";
  const hasRegistrationData = Boolean(
    email && registration.name && registration.password,
  );

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleBackToRegister = () => {
    navigate("/register", { state: { registration } });
  };

  const handleSendCode = async () => {
    if (!hasRegistrationData) {
      setErrorMessage(
        "Phiên đăng ký đã hết hạn. Vui lòng quay lại nhập lại thông tin.",
      );
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      /* await registerUser({
        email: registration.email,
        name: registration.name,
        password: registration.password,
      }); */
      setStep("otp");
      toast("Đã bỏ qua bước gửi mã để kiểm tra giao diện OTP.");
    } catch (error) {
      setErrorMessage(
        error.message || "Không thể gửi mã xác thực. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    setOtpError("");

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pastedOtp = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pastedOtp) return;

    setOtp(
      Array.from({ length: OTP_LENGTH }, (_, index) => pastedOtp[index] || ""),
    );
    setOtpError("");
    inputRefs.current[Math.min(pastedOtp.length, OTP_LENGTH) - 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    const verificationCode = otp.join("");

    if (verificationCode.length !== OTP_LENGTH) {
      setOtpError("Vui lòng nhập đủ 6 chữ số của mã xác thực.");
      return;
    }

    setOtpError("");
    setLoading(true);

    try {
      /*
      await verifyEmail({ email, otp: verificationCode });
      toast.success("Xác thực email thành công. Bạn có thể đăng nhập ngay.");
      navigate("/complete-register", { replace: true, state: { email } });
      */
      toast("Đã bỏ qua xác thực API để kiểm tra giao diện OTP.");
    } catch (error) {
      setOtpError(error.message || "Mã xác thực không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;

    setLoading(true);
    try {
      /* await resendVerificationOtp(email); */
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast("Đã bỏ qua API gửi lại mã để kiểm tra giao diện.");
    } catch (error) {
      setOtpError(error.message || "Không thể gửi lại mã xác thực.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="confirm-email-page"
      aria-label="Xác thực email Chạm Sắc Việt"
    >
      <section className="confirm-email-page__form-pane">
        <div className="confirm-email-page__content">
          <img
            className="confirm-email-page__logo"
            src={wtmLogo}
            alt="Logo Chạm Sắc Việt"
          />
          <header className="confirm-email-page__heading">
            {/* <p className="confirm-email-page__eyebrow">BẢO MẬT TÀI KHOẢN</p> */}
            <h1>Xác thực email</h1>
            <p>Hoàn tất bước cuối để bắt đầu hành trình khám phá di sản.</p>
          </header>

          {step === "email" && (
            <Card
              className="confirm-email-page__card"
              eyebrow="BƯỚC 1"
              title="Kiểm tra địa chỉ email"
              description="Chúng tôi sẽ gửi email xác thực đến địa chỉ email này:"
            >
              <div className="confirm-email-page__email-field">
                <Mail size={18} aria-hidden="true" />
                <Input
                  aria-label="Email đăng ký"
                  disabled
                  value={email || "Chưa có email đăng ký"}
                />
              </div>

              {errorMessage && (
                <p className="confirm-email-page__error" role="alert">
                  {errorMessage}
                </p>
              )}

              <div className="confirm-email-page__card-actions">
                <Button
                  variant="secondary"
                  type="button"
                  icon={<ArrowLeft size={18} aria-hidden="true" />}
                  onClick={handleBackToRegister}
                >
                  Quay lại đăng ký
                </Button>
                <Button
                  type="button"
                  icon={<Send size={18} aria-hidden="true" />}
                  loading={loading}
                  onClick={handleSendCode}
                >
                  Xác nhận gửi mã
                </Button>
              </div>
            </Card>
          )}

          {step === "otp" && (
            <Card
              className="confirm-email-page__card confirm-email-page__otp-card"
              eyebrow="BƯỚC 2"
              title="Nhập mã xác thực"
              description={`Nhập 6 chữ số được gửi đến ${email}.`}
              status="success"
            >
              <form onSubmit={handleVerify}>
                <div
                  className="confirm-email-page__otp-inputs"
                  aria-label="Mã xác thực 6 chữ số"
                >
                  {otp.map((digit, index) => (
                    <input
                      key={`otp-${index}`}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      aria-label={`Số thứ ${index + 1} của mã xác thực`}
                      className="confirm-email-page__otp-input"
                      inputMode="numeric"
                      maxLength={1}
                      type="text"
                      value={digit}
                      onChange={(event) =>
                        handleOtpChange(index, event.target.value)
                      }
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={handleOtpPaste}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="confirm-email-page__error" role="alert">
                    {otpError}
                  </p>
                )}

                <Button
                  className="confirm-email-page__verify-button"
                  type="submit"
                  loading={loading}
                >
                  Xác nhận email
                </Button>
              </form>

              <div className="confirm-email-page__resend">
                <span>Chưa nhận được mã?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0
                    ? `Gửi lại sau ${resendCooldown}s`
                    : "Gửi lại mã"}
                </button>
              </div>
            </Card>
          )}

          <p className="confirm-email-page__footer-copy">
            Cần hỗ trợ? <Link to="/contact-us">Liên hệ với Chạm Sắc Việt</Link>
          </p>
          {/* <Link className="confirm-email-page__home" to="/">
            Về trang chủ
          </Link> */}
        </div>
      </section>
    </main>
  );
}
