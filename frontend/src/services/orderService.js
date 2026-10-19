import { getAdminOrder, listAdminOrders } from './adminService.js'

export function getOrders({ page = 1, pageSize = 8, search = '', status = '' } = {}) {
  return listAdminOrders({ page, limit: pageSize, orderCode: search, orderStatus: status })
    .then((payload) => ({
      ...payload,
      data: {
        orders: payload.data || [],
        pagination: {
          page: payload.meta?.currentPage || page,
          pageSize: payload.meta?.limit || pageSize,
          total: payload.meta?.totalItems || 0,
          totalPages: payload.meta?.totalPages || 1,
        },
      },
    }))
}

export function getOrderById(orderId) {
  return getAdminOrder(orderId)
}
