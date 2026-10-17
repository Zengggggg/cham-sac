import { useEffect, useRef } from 'react'
import { LogOut, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import wtmLogo from '../../assets/wtm.png'
import './LogoutModal.scss'

function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Đăng xuất tài khoản?',
  description = 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?',
  cancelLabel = 'Ở lại',
  confirmLabel = 'Đăng xuất',
}) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="logout-modal__overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Card
        className="logout-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
      >
        <button
          ref={closeButtonRef}
          className="logout-modal__close"
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <img className="logout-modal__logo" src={wtmLogo} alt="Logo Chạm Sắc Việt" />
        <h2 id="logout-modal-title" className="logout-modal__title">{title}</h2>
        <p id="logout-modal-description" className="logout-modal__description">{description}</p>

        <div className="logout-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="primary" icon={<LogOut size={17} aria-hidden="true" />} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default LogoutModal;
