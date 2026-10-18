import { ArrowLeft, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import wtmLogo from '../../assets/wtm.png'
import './ForgotPassword.scss'

export default function ForgotPassword() {
  const handleSubmit = (event) => {
    event.preventDefault()
    toast('Chức năng gửi OTP khôi phục mật khẩu sẽ được tích hợp trong bước tiếp theo.')
  }

  return (
    <main className="forgot-password-page" aria-label="Quên mật khẩu">
      <section className="forgot-password-page__form-pane">
        <div className="forgot-password-page__content">
          <img
            className="forgot-password-page__logo"
            src={wtmLogo}
            alt="Logo Chạm Sắc Việt"
          />

          <header className="forgot-password-page__heading">
            <p className="forgot-password-page__eyebrow">KHÔI PHỤC TÀI KHOẢN</p>
            <h1>Quên mật khẩu?</h1>
            <p>Nhập email để nhận mã OTP xác nhận và khôi phục tài khoản.</p>
          </header>

          <Card className="forgot-password-page__card">
            <form onSubmit={handleSubmit}>
              <label className="forgot-password-page__label" htmlFor="forgot-password-email">
                Email đăng ký
              </label>
              <div className="forgot-password-page__email-field">
                <Mail size={18} aria-hidden="true" />
                <Input
                  id="forgot-password-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <Button className="forgot-password-page__submit" type="submit" size="lg">
                Gửi mã OTP
              </Button>
            </form>

            <div className="forgot-password-page__back-action">
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
