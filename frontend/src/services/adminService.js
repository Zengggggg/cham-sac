import { apiRequest, buildQuery } from './apiClient.js'

export const getDashboard = () => apiRequest('/admin/dashboard')
export const listUsers = ({ page = 1, limit = 20, search = '', status = '' } = {}) => apiRequest(`/admin/users${buildQuery({ page, limit, search, status })}`)
export const updateUserStatus = (userId, status, expectedUpdatedAt) => apiRequest(`/admin/users/${userId}/status`, { method: 'PATCH', body: { status, expectedUpdatedAt } })
export const listAdminProducts = ({ page = 1, limit = 20, search = '', status = '' } = {}) => apiRequest(`/admin/products${buildQuery({ page, limit, search, status })}`)
export const createAdminProduct = (product) => apiRequest('/admin/products', { method: 'POST', body: product })
export const createProductImageUpload = (file) => apiRequest('/admin/uploads/product-images/presign', {
  method: 'POST',
  body: { fileName: file.name, contentType: file.type, size: file.size },
})

export async function uploadProductImageToR2(file, upload) {
  let response
  try {
    response = await fetch(upload.uploadUrl, {
      method: 'PUT',
      headers: upload.headers || { 'Content-Type': file.type },
      body: file,
    })
  } catch {
    throw new Error('Không thể tải ảnh lên R2. Vui lòng kiểm tra kết nối và cấu hình CORS của bucket.')
  }

  if (!response.ok) {
    throw new Error('R2 từ chối ảnh tải lên. Vui lòng thử lại hoặc kiểm tra cấu hình bucket.')
  }

  return upload.publicUrl
}
export const listAdminOrders = ({ page = 1, limit = 20, orderCode = '', orderStatus = '' } = {}) => apiRequest(`/admin/orders${buildQuery({ page, limit, orderCode, orderStatus })}`)
export const getAdminOrder = (orderId) => apiRequest(`/admin/orders/${orderId}`)
export const updateAdminOrderStatus = (orderId, status, expectedUpdatedAt) => apiRequest(`/admin/orders/${orderId}/status`, {
  method: 'PATCH',
  body: { status, expectedUpdatedAt },
})
export const listAdminHeritageSites = ({ page = 1, limit = 100, search = '' } = {}) => apiRequest(`/admin/heritage-sites${buildQuery({ page, limit, search })}`)
export const getAdminPublicQuestions = (heritageSiteId) => apiRequest(`/admin/heritage-sites/${heritageSiteId}/questions`)
export const createAdminPublicQuestion = (heritageSiteId, content) => apiRequest(`/admin/heritage-sites/${heritageSiteId}/questions`, { method: 'POST', body: { content } })
export const updateAdminPublicQuestion = (heritageSiteId, questionId, content, expectedUpdatedAt) => apiRequest(`/admin/heritage-sites/${heritageSiteId}/questions/${questionId}`, { method: 'PATCH', body: { content, expectedUpdatedAt } })
export const deleteAdminPublicQuestion = (heritageSiteId, questionId, expectedUpdatedAt) => apiRequest(`/admin/heritage-sites/${heritageSiteId}/questions/${questionId}`, { method: 'DELETE', body: { expectedUpdatedAt } })
