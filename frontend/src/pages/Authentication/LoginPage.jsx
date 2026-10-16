import { useState } from 'react'
import { Eye, EyeOff, Languages, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import coverImage from '../../assets/pics/auth_cover.png'
import './LoginPage.scss'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      toast('Kết nối đăng nhập sẽ được tích hợp trong bước tiếp theo.')
    }, 700)
  }

  return (
    <main className="login-page" aria-label="Đăng nhập Chạm Sắc Việt">
      <section className="login-page__form-pane">
        <div className="login-page__controls" aria-label="Tùy chọn hiển thị">
          <button type="button" className="login-page__icon-button" aria-label="Đổi ngôn ngữ">
            <Languages size={19} aria-hidden="true" />
          </button>
          <button type="button" className="login-page__icon-button" aria-label="Chuyển chế độ tối">
            <Moon size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="login-page__content">
          <header className="login-page__heading">
            <p className="login-page__eyebrow">Chạm Sắc Việt</p>
            <h1>Đăng nhập</h1>
            <p>Chào mừng bạn trở lại với hành trình khám phá di sản.</p>
          </header>

          <Card className="login-page__card">
            <form onSubmit={handleSubmit}>
              <label className="login-page__label" htmlFor="login-email">Email</label>
              <input className="login-page__input" id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />

              <label className="login-page__label" htmlFor="login-password">Mật khẩu</label>
              <div className="login-page__password-field">
                <input className="login-page__input" id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu của bạn" required />
                <button type="button" className="login-page__password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                </button>
              </div>

              <Button className="login-page__submit" type="submit" size="lg" loading={loading}>Đăng nhập</Button>
              <Link className="login-page__forgot" to="/forgot-password">Quên mật khẩu?</Link>
            </form>
          </Card>

          <p className="login-page__register">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
          <Link className="login-page__home" to="/">Về trang chủ</Link>
        </div>
      </section>

      <aside className="login-page__cover" style={{ backgroundImage: `url(${coverImage})` }} aria-label="Ảnh minh họa văn hóa Việt Nam" />
    </main>
  )
}

export default LoginPage
