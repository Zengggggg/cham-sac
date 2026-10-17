import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import coverImage from '../../assets/pics/auth_cover.png'
import './RegisterPage.scss'

export default function RegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const registration = location.state?.registration || {}
  const [formValues, setFormValues] = useState({
    fullName: registration.name || '',
    email: registration.email || '',
    password: registration.password || '',
    confirmPassword: registration.confirmPassword || '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextRegistration = {
      confirmPassword: String(form.get('confirmPassword') || ''),
      email: String(form.get('email') || '').trim(),
      name: String(form.get('fullName') || '').trim(),
      password: String(form.get('password') || ''),
    }

    if (nextRegistration.password !== nextRegistration.confirmPassword) {
      setPasswordError('Mật khẩu nhập lại chưa khớp.')
      return
    }

    setPasswordError('')
    setFormValues({
      ...nextRegistration,
      fullName: nextRegistration.name,
    })
    navigate('/confirm-email', { state: { registration: nextRegistration } })
  }

  const handleGoogleRegister = () => {
    toast('Đăng ký bằng Google sẽ được tích hợp trong bước tiếp theo.')
  }

  return (
    <main className="register-page" aria-label="Đăng ký Chạm Sắc Việt">
      <aside className="register-page__cover" style={{ backgroundImage: `url(${coverImage})` }} aria-label="Ảnh minh họa văn hóa Việt Nam" />
      <section className="register-page__form-pane">
        <div className="register-page__content">
          <header className="register-page__heading">
            <p className="register-page__eyebrow">CHẠM SẮC VIỆT</p>
            <h1>Tạo tài khoản</h1>
            <p>Bắt đầu hành trình khám phá những câu chuyện di sản.</p>
          </header>

          <Card className="register-page__card">
            <form onSubmit={handleSubmit}>
              <label className="register-page__label" htmlFor="register-full-name">Tên đầy đủ</label>
              <Input id="register-full-name" name="fullName" type="text" autoComplete="name" placeholder="Nhập tên đầy đủ" defaultValue={formValues.fullName} required />

              <label className="register-page__label" htmlFor="register-email">Email</label>
              <Input id="register-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={formValues.email} required />

              <label className="register-page__label" htmlFor="register-password">Mật khẩu</label>
              <div className="register-page__password-field">
                <Input id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" defaultValue={formValues.password} minLength={8} required />
                <button type="button" className="register-page__password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button>
              </div>

              <label className="register-page__label" htmlFor="register-confirm-password">Nhập lại mật khẩu</label>
              <div className="register-page__password-field">
                <Input id="register-confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu" defaultValue={formValues.confirmPassword} minLength={8} aria-invalid={Boolean(passwordError)} required />
                <button type="button" className="register-page__password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showConfirmPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button>
              </div>
              {passwordError && <p className="register-page__error" role="alert">{passwordError}</p>}

              <Button className="register-page__submit" type="submit" size="lg">Tiếp tục</Button>
            </form>
          </Card>

          <p className="register-page__or">Hoặc</p>
          <Button className="register-page__google-button" variant="secondary" type="button" icon={<GoogleIcon />} onClick={handleGoogleRegister}>Tiếp tục với Google</Button>
          <p className="register-page__login">Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
          <Link className="register-page__home" to="/">Về trang chủ</Link>
        </div>
      </section>
    </main>
  )
}

function GoogleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.25Z" /><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.5Z" /><path fill="#FBBC05" d="M6.54 13.59A5.85 5.85 0 0 1 6.23 12c0-.55.11-1.09.31-1.59V7.89H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.11l3.24-2.52Z" /><path fill="#EA4335" d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.46 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.52c.77-2.31 2.92-4.03 5.46-4.03Z" /></svg>
}
