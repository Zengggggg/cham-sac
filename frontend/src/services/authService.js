const API_PREFIX = '/chamsacviet'
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || 'Không thể kết nối đến hệ thống.')
    error.statusCode = payload?.statusCode || response.status
    error.errors = payload?.errors || null
    throw error
  }

  return payload
}

export function registerUser({ name, email, password }) {
  return request('/auth/register', {
    body: JSON.stringify({ name, email, password }),
    method: 'POST',
  })
}

export function verifyEmail({ email, otp }) {
  return request('/auth/verify-email', {
    body: JSON.stringify({ email, otp }),
    method: 'POST',
  })
}

export function resendVerificationOtp(email) {
  return request('/auth/resend-verification-otp', {
    body: JSON.stringify({ email }),
    method: 'POST',
  })
}
