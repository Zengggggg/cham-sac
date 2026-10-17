import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, History, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import wtmLogo from '../../assets/wtm.png'
import './EnterOldPassword.scss'

export default function EnterOldPassword() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/user-profile')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const password = String(new FormData(event.currentTarget).get('password') || '')

    if (!password) {
      const message = 'Vui lòng nhập mật khẩu hiện tại.'
      setPasswordError(message)
      toast.error(message)
      return
    }

    setPasswordError('')
    navigate('/reset-password')
  }

  return (
    <main className="enter-old-password-page" aria-label="Nhập mật khẩu hiện tại">
      <section className="enter-old-password-page__form-pane">
        <div className="enter-old-password-page__content">
          <img
            className="enter-old-password-page__logo"
            src={wtmLogo}
            alt="Logo Chạm Sắc Việt"
          />

          <header className="enter-old-password-page__heading">
            <p className="enter-old-password-page__eyebrow">BẢO MẬT TÀI KHOẢN</p>
            <h1>Đổi mật khẩu</h1>
            <p>Nhập mật khẩu hiện tại để tiếp tục thay đổi mật khẩu.</p>
          </header>

          <Card className="enter-old-password-page__card">
            <form onSubmit={handleSubmit}>
              <label className="enter-old-password-page__label" htmlFor="old-password">
                Mật khẩu hiện tại
              </label>
              <div className="enter-old-password-page__password-field">
                <LockKeyhole className="enter-old-password-page__password-icon" size={18} aria-hidden="true" />
                <Input
                  id="old-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  aria-invalid={Boolean(passwordError)}
                />
                <button
                  type="button"
                  className="enter-old-password-page__password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                >
                  {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                </button>
              </div>

              {passwordError && <p className="enter-old-password-page__error" role="alert">{passwordError}</p>}

              <Button className="enter-old-password-page__submit" type="submit" size="lg">
                Tiếp tục
              </Button>
            </form>

            <div className="enter-old-password-page__back-action">
              <Button
                type="button"
                variant="ghost"
                icon={<History size={18} aria-hidden="true" />}
                onClick={handleGoBack}
              >
                Quay lại trang trước
              </Button>
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
