const API_PREFIX = '/chamsacviet'
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, options = {}) {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export function getContacts({ page = 1, pageSize = 6, search = '', status = '', sort = 'newest' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search,
    status,
    sort,
  })

  return request(`/contacts?${params.toString()}`)
}

export function updateContactStatus(contactId, isContactted) {
  return request(`/contacts/${contactId}/status`, {
    body: JSON.stringify({ isContactted }),
    method: 'PATCH',
  })
}
