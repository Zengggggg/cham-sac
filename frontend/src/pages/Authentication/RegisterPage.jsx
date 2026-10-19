import { useCallback, useState } from 'react'
import { Eye, EyeOff, House } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton.jsx'
import coverImage from '../../assets/pics/auth_cover.png'
import { loginWithGoogle, registerUser } from '../../services/authService.js'
import './RegisterPage.scss'

export default function RegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const registration = location.state?.registration || {}
  const [formValues] = useState({
    fullName: registration.name || '',
    email: registration.email || '',
    password: registration.password || '',
    confirmPassword: registration.confirmPassword || '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (event) => {
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
    setLoading(true)
    try {
      const response = await registerUser(nextRegistration)
      toast.success(response.message)
      navigate('/confirm-email', {
        state: {
          registration: {
            email: nextRegistration.email,
            name: nextRegistration.name,
          },
          verification: {
            ...response.data,
            email: response.data?.email || nextRegistration.email,
            otpSent: true,
          },
        },
      })
    } catch (error) {
      if (error.statusCode === 409 && error.message.includes('chờ xác minh')) {
        toast('Tài khoản đang chờ xác minh. Bạn có thể yêu cầu gửi lại mã OTP.')
        navigate('/confirm-email', {
          state: {
            registration: {
              email: nextRegistration.email,
              name: nextRegistration.name,
            },
            verification: {
              email: nextRegistration.email,
              verificationRequired: true,
              otpSent: false,
            },
          },
        })
        return
      }
      toast.error(error.message || 'Không thể tạo tài khoản. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = useCallback(async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Google không trả về thông tin đăng nhập hợp lệ.')
      return
    }

    setGoogleLoading(true)
    try {
      const response = await loginWithGoogle(credentialResponse.credential)
      const user = response.data.user
      toast.success(response.message || 'Đăng ký bằng Google thành công.')
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/')
    } catch (error) {
      toast.error(error.message || 'Không thể tiếp tục bằng Google.')
    } finally {
      setGoogleLoading(false)
    }
  }, [navigate])

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

              <Button className="register-page__submit" type="submit" size="lg" loading={loading} disabled={googleLoading}>Tiếp tục</Button>
            </form>
          </Card>

          <p className="register-page__or">Hoặc</p>
          <GoogleSignInButton
            disabled={loading || googleLoading}
            onCredential={handleGoogleCredential}
            text="signup_with"
          />
          <p className="register-page__login">Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
          <Link className="register-page__home" to="/">
            <House size={16} aria-hidden="true" />
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  )
}
