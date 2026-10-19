import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CircleHelp, TriangleAlert, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import wtmLogo from '../../assets/wtm.png'
import './ConfirmModal.scss'

const noop = () => {}

function ConfirmModal({
  isOpen = false,
  onClose = noop,
  onConfirm = noop,
  title = 'Xác nhận thao tác',
  description = 'Bạn có chắc chắn muốn tiếp tục không?',
  cancelLabel = 'Hủy',
  confirmLabel = 'Xác nhận',
  tone = 'default',
  isLoading = false,
}) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const isLoadingRef = useRef(isLoading)
  const titleId = useId()
  const descriptionId = useId()
  const isDanger = tone === 'danger'
  const StatusIcon = isDanger ? TriangleAlert : CircleHelp

  useEffect(() => {
    onCloseRef.current = onClose
    isLoadingRef.current = isLoading
  }, [onClose, isLoading])

  useEffect(() => {
    if (!isOpen) return undefined

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector('.confirm-modal__cancel')?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoadingRef.current) {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="confirm-modal__overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="confirm-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <Card className={`confirm-modal__card${isDanger ? ' confirm-modal__card--danger' : ''}`}>
          <button
            className="confirm-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            disabled={isLoading}
          >
            <X size={20} aria-hidden="true" />
          </button>

          <div className="confirm-modal__brand">
            <img className="confirm-modal__logo" src={wtmLogo} alt="Logo Chạm Sắc Việt" />
            <span className="confirm-modal__icon" aria-hidden="true">
              <StatusIcon size={21} strokeWidth={2.2} />
            </span>
          </div>
          <h2 id={titleId} className="confirm-modal__title">{title}</h2>
          {description && <p id={descriptionId} className="confirm-modal__description">{description}</p>}

          <div className="confirm-modal__actions">
            <Button className="confirm-modal__cancel" type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={isDanger ? 'danger' : 'primary'}
              onClick={onConfirm}
              loading={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </Card>
      </div>
    </div>,
    document.body,
  )
}

export default ConfirmModal
