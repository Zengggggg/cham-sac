import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import wtmLogo from '../../assets/wtm.png'
import './Reset_Password.scss'

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')

    if (password.length < 8) {
      const message = 'Mật khẩu mới phải có ít nhất 8 ký tự.'
      setPasswordError(message)
      toast.error(message)
      return
    }

    if (password !== confirmPassword) {
      const message = 'Mật khẩu xác nhận chưa khớp.'
      setPasswordError(message)
      toast.error(message)
      return
    }

    setPasswordError('')
    toast('Chức năng đặt lại mật khẩu sẽ được tích hợp trong bước tiếp theo.')
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
            <p>Tạo mật khẩu mới để tiếp tục sử dụng tài khoản của bạn.</p>
          </header>

          <Card className="reset-password-page__card">
            <form onSubmit={handleSubmit}>
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

              <Button className="reset-password-page__submit" type="submit" size="lg">
                Đặt lại mật khẩu
              </Button>
            </form>

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
