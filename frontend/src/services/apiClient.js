const API_PREFIX = '/chamsacviet'
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

let refreshPromise = null

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

export const getStoredUser = () => readJson('user')
export const getAccessToken = () => localStorage.getItem('accessToken')
export const getRefreshToken = () => localStorage.getItem('refreshToken')

export function saveAuthSession(auth) {
  if (!auth?.accessToken || !auth?.refreshToken || !auth?.user) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.')
  }

  localStorage.setItem('accessToken', auth.accessToken)
  localStorage.setItem('refreshToken', auth.refreshToken)
  localStorage.setItem('user', JSON.stringify(auth.user))
  window.dispatchEvent(new Event('auth:login'))
}

export function clearAuthSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event('auth:logout'))
}

function createApiError(payload, response) {
  const error = new Error(payload?.message || 'Không thể kết nối đến hệ thống.')
  error.statusCode = payload?.statusCode || response.status
  error.errors = Array.isArray(payload?.errors) ? payload.errors : null
  return error
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) throw createApiError(payload, response)
  return payload
}

async function refreshSession() {
  if (refreshPromise) return refreshPromise
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshPromise = fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(parseResponse)
    .then((payload) => {
      saveAuthSession(payload.data)
      return payload.data.accessToken
    })
    .catch((error) => {
      clearAuthSession()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function apiRequest(path, options = {}) {
  const { auth = true, retry = true, headers = {}, body, ...fetchOptions } = options
  const token = auth ? getAccessToken() : null
  const requestHeaders = {
    ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      ...fetchOptions,
      headers: requestHeaders,
      ...(body !== undefined ? { body: body instanceof FormData || typeof body === 'string' ? body : JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
  }

  if (response.status === 401 && auth && retry && getRefreshToken()) {
    const nextAccessToken = await refreshSession()
    if (nextAccessToken) return apiRequest(path, { ...options, retry: false })
  }

  return parseResponse(response)
}

export function buildQuery(values = {}) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}
