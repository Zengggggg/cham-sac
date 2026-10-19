import { apiRequest, buildQuery } from './apiClient.js'

export const listProducts = ({ page = 1, limit = 100 } = {}) => (
  apiRequest(`/shop/boxes${buildQuery({ page, limit })}`, { auth: false })
)

export const getProduct = (productId) => apiRequest(`/shop/boxes/${productId}`, { auth: false })
export const getCart = () => apiRequest('/cart')
export const addCartItem = (productId, quantity = 1) => apiRequest('/cart/items', { method: 'POST', body: { productId, quantity } })
export const updateCartItem = (productId, updates) => apiRequest(`/cart/items/${productId}`, { method: 'PATCH', body: updates })
export const removeCartItem = (productId) => apiRequest(`/cart/items/${productId}`, { method: 'DELETE' })
export const createOrder = (checkout, idempotencyKey) => apiRequest('/orders', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: checkout })
export const listMyOrders = ({ page = 1, limit = 50 } = {}) => apiRequest(`/orders/me${buildQuery({ page, limit })}`)
export const getMyOrder = (orderId) => apiRequest(`/orders/${orderId}`)
export const createPayment = (orderId) => apiRequest('/payments/payos', { method: 'POST', body: { orderId } })
export const getPaymentStatus = (orderId) => apiRequest(`/payments/${orderId}/status`)
