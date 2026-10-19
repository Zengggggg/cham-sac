import { useEffect, useRef, useState } from 'react'
import './GoogleSignInButton.scss'

const GOOGLE_SCRIPT_ID = 'google-identity-services'
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client?hl=vi'

let googleScriptPromise = null
let initializedClientId = null
let activeCredentialHandler = null

const dispatchGoogleCredential = (response) => {
  activeCredentialHandler?.(response)
}

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID)
    const handleLoad = () => {
      if (window.google?.accounts?.id) resolve(window.google)
      else reject(new Error('Google Identity Services không khả dụng.'))
    }
    const handleError = () => reject(new Error('Không thể tải Google Identity Services.'))

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true })
      existingScript.addEventListener('error', handleError, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = GOOGLE_SCRIPT_URL
    script.async = true
    script.defer = true
    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    document.head.append(script)
  }).catch((error) => {
    googleScriptPromise = null
    throw error
  })

  return googleScriptPromise
}

export default function GoogleSignInButton({ disabled = false, onCredential, text = 'signin_with' }) {
  const buttonContainerRef = useRef(null)
  const credentialCallbackRef = useRef(onCredential)
  const [errorMessage, setErrorMessage] = useState('')
  const [ready, setReady] = useState(false)
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
  const displayedError = errorMessage || (clientId ? '' : 'Đăng nhập Google chưa được cấu hình.')

  useEffect(() => {
    credentialCallbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let active = true
    const credentialHandler = (response) => {
      if (active) credentialCallbackRef.current?.(response)
    }
    activeCredentialHandler = credentialHandler

    if (!clientId) {
      return () => {
        active = false
        if (activeCredentialHandler === credentialHandler) activeCredentialHandler = null
      }
    }

    loadGoogleIdentityServices()
      .then((google) => {
        if (!active || !buttonContainerRef.current) return

        if (initializedClientId && initializedClientId !== clientId) {
          throw new Error('Google Client ID không đồng nhất. Hãy tải lại trang.')
        }

        if (!initializedClientId) {
          google.accounts.id.initialize({
            auto_select: false,
            callback: dispatchGoogleCredential,
            client_id: clientId,
            ux_mode: 'popup',
          })
          initializedClientId = clientId
        }

        const width = Math.min(
          400,
          Math.max(240, Math.floor(buttonContainerRef.current.clientWidth)),
        )
        buttonContainerRef.current.replaceChildren()
        google.accounts.id.renderButton(buttonContainerRef.current, {
          locale: 'vi',
          logo_alignment: 'left',
          shape: 'rectangular',
          size: 'large',
          text,
          theme: 'outline',
          type: 'standard',
          width,
        })
        setReady(true)
      })
      .catch((error) => {
        if (active) setErrorMessage(error.message || 'Không thể khởi tạo đăng nhập Google.')
      })

    return () => {
      active = false
      if (activeCredentialHandler === credentialHandler) activeCredentialHandler = null
    }
  }, [clientId, text])

  return (
    <div
      className={`google-sign-in${disabled ? ' google-sign-in--disabled' : ''}`}
      aria-busy={!ready || disabled}
    >
      <div ref={buttonContainerRef} className="google-sign-in__button" />
      {!ready && !displayedError && (
        <p className="google-sign-in__status" role="status">Đang tải đăng nhập Google…</p>
      )}
      {displayedError && (
        <p className="google-sign-in__status google-sign-in__status--error" role="alert">
          {displayedError}
        </p>
      )}
    </div>
  )
}
