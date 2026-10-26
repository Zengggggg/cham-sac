import { apiRequest, clearAuthSession, getRefreshToken, saveAuthSession } from './apiClient.js'

export function registerUser({ name, email, password }) {
  return apiRequest('/auth/register', {
    auth: false,
    body: { name, email, password },
    method: 'POST',
  })
}

export function verifyEmail({ email, otp }) {
  return apiRequest('/auth/verify-email', {
    auth: false,
    body: { email, otp },
    method: 'POST',
  }).then((payload) => {
    saveAuthSession(payload.data)
    return payload
  })
}

export function resendVerificationOtp(email) {
  return apiRequest('/auth/resend-verification-otp', {
    auth: false,
    body: { email },
    method: 'POST',
  })
}

export function loginUser({ email, password }) {
  return apiRequest('/auth/login', {
    auth: false,
    body: { email, password },
    method: 'POST',
  }).then((payload) => {
    saveAuthSession(payload.data)
    return payload
  })
}

export function requestPasswordResetOtp(email) {
  return apiRequest('/auth/forgot-password', {
    auth: false,
    body: { email },
    method: 'POST',
  })
}

export function resetPassword({ email, otp, password }) {
  return apiRequest('/auth/reset-password', {
    auth: false,
    body: { email, otp, password },
    method: 'POST',
  })
}

export function loginWithGoogle(idToken) {
  return apiRequest('/auth/google', {
    auth: false,
    body: { idToken },
    method: 'POST',
  }).then((payload) => {
    saveAuthSession(payload.data)
    return payload
  })
}

export function getCurrentUser() {
  return apiRequest('/auth/me')
}

export async function logoutUser() {
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        auth: false,
        body: { refreshToken },
        method: 'POST',
      })
    }
  } finally {
    clearAuthSession()
  }
}
