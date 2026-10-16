import { LoaderCircle } from 'lucide-react'
import './Button.scss'

function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  type = 'button',
  className = '',
  ...props
}) {
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    `ui-button--${size}`,
    loading ? 'ui-button--loading' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <LoaderCircle className="ui-button__spinner" aria-hidden="true" /> : iconPosition === 'left' ? icon : null}
      <span>{loading ? 'Đang xử lý...' : children}</span>
      {!loading && iconPosition === 'right' ? icon : null}
    </button>
  )
}

export default Button
