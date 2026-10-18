import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import Button from './Button.jsx'
import './Modal.scss'

function Modal({ open, onClose, title, description, children, actions, size = 'md' }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    closeButtonRef.current?.focus()
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="ui-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className={`ui-modal__dialog ui-modal__dialog--${size}`} role="dialog" aria-modal="true" aria-labelledby="ui-modal-title">
        <header className="ui-modal__header">
          <div>
            <h2 id="ui-modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button ref={closeButtonRef} className="ui-modal__close" type="button" onClick={onClose} aria-label="Đóng cửa sổ">
            <X aria-hidden="true" />
          </button>
        </header>
        {children && <div className="ui-modal__body">{children}</div>}
        {actions && <footer className="ui-modal__footer">{actions}</footer>}
      </section>
    </div>,
    document.body,
  )
}

export function ModalActions({ onCancel, onConfirm, confirmLabel = 'Xác nhận' }) {
  return <><Button variant="ghost" onClick={onCancel}>Hủy</Button><Button onClick={onConfirm}>{confirmLabel}</Button></>
}

export default Modal
