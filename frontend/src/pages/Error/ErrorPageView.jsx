import { ArrowLeft, House, LockKeyhole, WifiOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import './ErrorPages.scss'

const iconByCode = { 403: LockKeyhole, 404: LockKeyhole, 503: WifiOff }

function ErrorPageView({ code, eyebrow, title, description, statusLabel, variant = 'not-found' }) {
  const navigate = useNavigate()
  const Icon = iconByCode[code] || LockKeyhole

  return (
    <main className={`error-page error-page--${variant}`}>
      <aside className="error-page__rail" aria-hidden="true">
        <span>Chạm Sắc Việt</span>
        <strong>{code}</strong>
      </aside>
      <section className="error-page__content" aria-labelledby={`error-title-${code}`}>
        <div className="error-page__signal" aria-hidden="true"><span /><span /><span /></div>
        <p className="error-page__eyebrow">{eyebrow}</p>
        <h1 id={`error-title-${code}`}>{title}</h1>
        <p className="error-page__description">{description}</p>
        <div className="error-page__actions">
          <Button as={Link} to="/" className="error-page__action error-page__action--primary" icon={<House size={17} aria-hidden="true" />}>Về trang chủ</Button>
          <Button variant="secondary" className="error-page__action error-page__action--secondary" icon={<ArrowLeft size={17} aria-hidden="true" />} onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
        <p className="error-page__status" aria-live="polite"><span>Trạng thái</span><strong>{statusLabel}</strong></p>
      </section>
      <aside className="error-page__visual" aria-label={`Minh họa trạng thái ${code}`}>
        <div className="error-page__visual-art" aria-hidden="true">
          <span className="error-page__visual-orbit error-page__visual-orbit--one" />
          <span className="error-page__visual-orbit error-page__visual-orbit--two" />
          <div className="error-page__visual-mark"><Icon size={72} strokeWidth={1.4} /><strong>{code}</strong></div>
          <span className="error-page__visual-dot error-page__visual-dot--one" />
          <span className="error-page__visual-dot error-page__visual-dot--two" />
        </div>
        <span className="error-page__visual-code">{code}</span>
      </aside>
    </main>
  )
}

export default ErrorPageView
