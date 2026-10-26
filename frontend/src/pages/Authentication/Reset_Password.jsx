import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import { requestPasswordResetOtp, resetPassword } from '../../services/authService.js'
import wtmLogo from '../../assets/wtm.png'
import './Reset_Password.scss'

const RESEND_COOLDOWN_SECONDS = 60

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const passwordReset = location.state?.passwordReset || {}
  const email = passwordReset.email || ''
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(
    passwordReset.resendAvailableInSeconds || RESEND_COOLDOWN_SECONDS,
  )

  useEffect(() => {
    if (!email || resendCooldown <= 0) return undefined

    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [email, resendCooldown])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')

    if (!email) {
      setPasswordError('Phiên đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu OTP mới.')
      return
    }
    if (!/^\d{6}$/.test(otp)) {
      setPasswordError('Mã OTP phải gồm đúng 6 chữ số.')
      return
    }
    if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setPasswordError('Mật khẩu mới phải có 8-72 ký tự, gồm ít nhất một chữ cái và một chữ số.')
      return
    }
    if (password !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận chưa khớp.')
      return
    }

    setPasswordError('')
    setLoading(true)
    try {
      const response = await resetPassword({ email, otp, password })
      toast.success(response.message || 'Đặt lại mật khẩu thành công.')
      navigate('/login', { replace: true })
    } catch (error) {
      const message = error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
      setPasswordError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || resendCooldown > 0 || resendLoading) return

    setPasswordError('')
    setResendLoading(true)
    try {
      const response = await requestPasswordResetOtp(email)
      setOtp('')
      setResendCooldown(
        response.data?.resendAvailableInSeconds || RESEND_COOLDOWN_SECONDS,
      )
      toast.success(response.message || 'Đã gửi lại OTP đặt lại mật khẩu.')
    } catch (error) {
      const message = error.message || 'Không thể gửi lại OTP. Vui lòng thử lại.'
      setPasswordError(message)
      toast.error(message)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <main className="reset-password-page" aria-label="Đặt lại mật khẩu">
      <section className="reset-password-page__form-pane">
        <div className="reset-password-page__content">
          <img
            className="reset-password-page__logo"
            src={wtmLogo}
            alt="Logo Chạm Sắc Việt"
          />

          <header className="reset-password-page__heading">
            <p className="reset-password-page__eyebrow">BẢO MẬT TÀI KHOẢN</p>
            <h1>Đặt lại mật khẩu</h1>
            <p>Nhập OTP trong email và tạo mật khẩu mới cho tài khoản của bạn.</p>
          </header>

          <Card className="reset-password-page__card">
            {!email ? (
              <div className="reset-password-page__missing-session" role="alert">
                <p>Phiên đặt lại mật khẩu không hợp lệ hoặc đã bị làm mới.</p>
                <Button as={Link} to="/forgot-password" icon={<KeyRound size={18} aria-hidden="true" />}>
                  Yêu cầu OTP mới
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="reset-password-page__label" htmlFor="reset-email">
                  Email
                </label>
                <div className="reset-password-page__readonly-field">
                  <Mail size={18} aria-hidden="true" />
                  <Input id="reset-email" value={email} disabled />
                </div>

                <label className="reset-password-page__label" htmlFor="reset-otp">
                  Mã OTP
                </label>
                <div className="reset-password-page__otp-field">
                  <KeyRound size={18} aria-hidden="true" />
                  <Input
                    id="reset-otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="Nhập 6 chữ số"
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                      setPasswordError('')
                    }}
                    required
                  />
                </div>

                <label className="reset-password-page__label" htmlFor="reset-password">
                  Mật khẩu mới
                </label>
                <div className="reset-password-page__password-field">
                  <LockKeyhole className="reset-password-page__password-icon" size={18} aria-hidden="true" />
                  <Input
                    id="reset-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Nhập mật khẩu mới"
                    minLength={8}
                    maxLength={72}
                    required
                    aria-invalid={Boolean(passwordError)}
                  />
                  <button
                    type="button"
                    className="reset-password-page__password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                  >
                    {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                  </button>
                </div>

                <label className="reset-password-page__label" htmlFor="reset-confirm-password">
                  Xác nhận mật khẩu mới
                </label>
                <div className="reset-password-page__password-field">
                  <LockKeyhole className="reset-password-page__password-icon" size={18} aria-hidden="true" />
                  <Input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu mới"
                    minLength={8}
                    maxLength={72}
                    required
                    aria-invalid={Boolean(passwordError)}
                  />
                  <button
                    type="button"
                    className="reset-password-page__password-toggle"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                  >
                    {showConfirmPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                  </button>
                </div>

                {passwordError && <p className="reset-password-page__error" role="alert">{passwordError}</p>}

                <Button className="reset-password-page__submit" type="submit" size="lg" loading={loading} disabled={resendLoading}>
                  Đặt lại mật khẩu
                </Button>

                <div className="reset-password-page__resend">
                  <span>Chưa nhận được mã?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading || resendLoading}
                  >
                    {resendLoading
                      ? 'Đang gửi...'
                      : resendCooldown > 0
                        ? `Gửi lại sau ${resendCooldown}s`
                        : 'Gửi lại mã'}
                  </button>
                </div>
              </form>
            )}

            <div className="reset-password-page__back-action">
              <Button
                as={Link}
                to="/login"
                variant="secondary"
                icon={<ArrowLeft size={18} aria-hidden="true" />}
              >
                Quay lại đăng nhập
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </main>
  )
}
