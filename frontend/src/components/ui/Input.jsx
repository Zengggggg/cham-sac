import './Input.scss'

function Input({ className = '', ...props }) {
  return <input {...props} className={['ui-input', className].filter(Boolean).join(' ')} />
}

export default Input
