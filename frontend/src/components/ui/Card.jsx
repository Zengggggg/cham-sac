import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import './Card.scss'

function Card({ children, title, eyebrow, description, status, actions, featured = false, className = '', ...rest }) {
  const classes = ['ui-card', featured ? 'ui-card--featured' : '', status ? `ui-card--${status}` : '', className].filter(Boolean).join(' ')
  const StatusIcon = status === 'success' ? CheckCircle2 : status === 'error' ? AlertCircle : Info

  return (
    <article {...rest} className={classes}>
      {eyebrow && <p className="ui-card__eyebrow">{eyebrow}</p>}
      <div className="ui-card__heading">
        <div>
          {title && <h3>{title}</h3>}
          {description && <p className="ui-card__description">{description}</p>}
        </div>
        {status && <StatusIcon className="ui-card__status-icon" aria-label={status} />}
      </div>
      {children && <div className="ui-card__body">{children}</div>}
      {actions && <div className="ui-card__actions">{actions}</div>}
    </article>
  )
}

export default Card
