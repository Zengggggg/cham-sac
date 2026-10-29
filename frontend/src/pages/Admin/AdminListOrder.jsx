import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { getOrderById, getOrders } from '../../services/orderService.js'
import { updateAdminOrderStatus } from '../../services/adminService.js'
import './AdminListOrder.scss'

const PAGE_SIZE = 8

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  done: 'Hoàn tất',
  cancelled: 'Đã hủy',
}

const paymentLabels = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
}

const nextOrderStatus = {
  pending: { status: 'confirmed', label: 'Xác nhận đơn hàng' },
  confirmed: { status: 'shipping', label: 'Chuyển sang đang giao' },
  shipping: { status: 'done', label: 'Xác nhận hoàn tất' },
}

const getErrorMessage = (error) => error?.message || 'Không thể tải danh sách đơn hàng.'
const getOrderPayload = (response) => response?.data || response || {}
const getCustomer = (order) => order?.customer || order?.buyerInfo || order?.userId || {}
const getOrderId = (order) => order?.id || order?._id
const getItemCount = (order) => (order?.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0)
const formatShortOrderCode = (orderCode) => {
  const value = String(orderCode || '')
  const parts = value.split('-')
  return parts.length > 2 ? `#${parts.at(-1)}` : `#${value}`
}
const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { currency: 'VND', maximumFractionDigits: 0, style: 'currency' }).format(Number(amount) || 0)
const formatDate = (date) => date ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : 'Chưa cập nhật'

function AdminListOrder() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 })
  const [summary, setSummary] = useState({ totalOrders: 0, totalValue: 0, paidCount: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadOrders = useCallback(async (requestedPage = 1) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getOrders({ page: requestedPage, pageSize: PAGE_SIZE, search: searchTerm, status: statusFilter })
      const payload = getOrderPayload(response)
      const nextOrders = payload.orders || []
      const nextPagination = payload.pagination || { page: requestedPage, pageSize: PAGE_SIZE, total: nextOrders.length, totalPages: 1 }
      const fallbackSummary = {
        totalOrders: nextPagination.total ?? nextOrders.length,
        totalValue: nextOrders.reduce((total, order) => total + Number(order.totalAmount || 0), 0),
        paidCount: nextOrders.filter((order) => order.paymentStatus === 'paid').length,
      }
      setOrders(nextOrders)
      setPagination(nextPagination)
      setSummary(payload.summary && Number(payload.summary.totalOrders) > 0 ? payload.summary : fallbackSummary)
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setOrders([])
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, statusFilter])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadOrders(1) }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadOrders])

  const visibleOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return orders
    return orders.filter((order) => {
      const customer = getCustomer(order)
      return [order.orderCode, getOrderId(order), customer.fullName, customer.email, customer.phone]
        .some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
    })
  }, [orders, searchTerm])

  const totalValue = summary.totalValue
  const paidCount = summary.paidCount
  const totalOrders = pagination.total ?? orders.length

  const openDetail = async (order) => {
    setSelectedOrder(order)
    setIsDetailLoading(true)
    try {
      const orderId = order.id || order._id
      if (!orderId) throw new Error('Đơn hàng không có mã định danh hợp lệ.')
      const response = await getOrderById(orderId)
      const payload = getOrderPayload(response)
      setSelectedOrder(payload.order || payload)
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setIsDetailLoading(false)
    }
  }

  const advanceOrderStatus = async (order) => {
    const next = nextOrderStatus[order.orderStatus]
    if (!next || isUpdatingStatus) return
    if (order.orderStatus === 'pending' && order.paymentStatus !== 'paid') {
      toast.error('Chỉ có thể xác nhận đơn sau khi thanh toán thành công.')
      return
    }

    setIsUpdatingStatus(true)
    try {
      const response = await updateAdminOrderStatus(getOrderId(order), next.status, order.updatedAt)
      const updatedOrder = response?.data?.order
      if (!updatedOrder) throw new Error('Máy chủ chưa trả về đơn hàng đã cập nhật.')

      setSelectedOrder(updatedOrder)
      setOrders((currentOrders) => currentOrders.map((currentOrder) => (
        getOrderId(currentOrder) === getOrderId(updatedOrder) ? updatedOrder : currentOrder
      )))
      toast.success(`Đã chuyển đơn sang trạng thái ${statusLabels[next.status]}.`)
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="admin-order-page">
      <header className="admin-order-page__hero">
        <div>
          <p className="admin-order-page__eyebrow"><ShoppingBag size={16} aria-hidden="true" /> VẬN HÀNH ĐƠN HÀNG</p>
          <h1>Đơn hàng</h1>
          <p className="admin-order-page__lead">Theo dõi đơn hàng, thanh toán và tiến trình giao sản phẩm trong hệ thống.</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={17} aria-hidden="true" />} onClick={() => loadOrders(pagination.page)} loading={isLoading}>Làm mới</Button>
      </header>

      <div className="admin-order-page__meta">
        <span><PackageCheck size={16} aria-hidden="true" /> Dữ liệu đơn hàng từ hệ thống</span>
        <small>{totalOrders} đơn hàng</small>
      </div>

      <section className="admin-order-page__stats" aria-label="Tổng quan đơn hàng">
        <Card className="admin-order-page__stat"><FileText size={20} aria-hidden="true" /><span><small>Đơn hàng hiện tại</small><strong>{summary.totalOrders}</strong></span></Card>
        <Card className="admin-order-page__stat admin-order-page__stat--gold"><ShoppingBag size={20} aria-hidden="true" /><span><small>Giá trị trang hiện tại</small><strong>{formatMoney(totalValue)}</strong></span></Card>
        <Card className="admin-order-page__stat admin-order-page__stat--turquoise"><PackageCheck size={20} aria-hidden="true" /><span><small>Đã thanh toán</small><strong>{paidCount}</strong></span></Card>
      </section>

      <Card className="admin-order-page__card">
        <div className="admin-order-page__toolbar">
          <div className="admin-order-page__summary"><strong>{totalOrders}</strong><span>đơn hàng</span></div>
          <div className="admin-order-page__filters">
            <form className="admin-order-page__search" onSubmit={(event) => { event.preventDefault(); setSearchTerm(searchInput.trim()) }}>
              <Search size={17} aria-hidden="true" />
              <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm mã đơn hoặc khách hàng" aria-label="Tìm kiếm đơn hàng" />
              <Button type="submit" size="sm" icon={<Search size={15} aria-hidden="true" />}>Tìm kiếm</Button>
            </form>
            <label className="admin-order-page__select"><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tất cả</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-order-page__state" role="status"><LoaderCircle className="admin-order-page__spinner" size={28} aria-hidden="true" /><strong>Đang tải danh sách đơn hàng</strong></div>
        ) : error ? (
          <div className="admin-order-page__state admin-order-page__state--error" role="alert"><AlertCircle size={28} aria-hidden="true" /><strong>Không thể tải dữ liệu đơn hàng</strong><p>{error}</p><Button size="sm" onClick={() => loadOrders(pagination.page)} icon={<RefreshCw size={15} aria-hidden="true" />}>Thử lại</Button></div>
        ) : visibleOrders.length === 0 ? (
          <div className="admin-order-page__state" role="status"><ShoppingBag size={28} aria-hidden="true" /><strong>Chưa có đơn hàng nào</strong><p>Đơn hàng phát sinh từ khu vực mua sắm sẽ xuất hiện tại đây.</p></div>
        ) : (
          <div className="admin-order-page__table-wrap">
            <table className="admin-order-page__table">
              <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày tạo</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>{visibleOrders.map((order) => {
                const customer = getCustomer(order)
                return <tr key={getOrderId(order) || order.orderCode}>
                  <td><strong className="admin-order-page__code" title={order.orderCode || getOrderId(order)}>{formatShortOrderCode(order.orderCode || getOrderId(order))}</strong><small>{paymentLabels[order.paymentStatus] || 'Chưa cập nhật'}</small></td>
                  <td><div className="admin-order-page__customer"><UserRound size={17} aria-hidden="true" /><span><strong>{customer.fullName || customer.name || 'Khách hàng'}</strong><small>{customer.email || 'Chưa cập nhật email'}</small></span></div></td>
                  <td><span className="admin-order-page__date"><CalendarDays size={14} aria-hidden="true" />{formatDate(order.createdAt)}</span></td>
                  <td>{getItemCount(order)}</td>
                  <td><strong>{formatMoney(order.totalAmount)}</strong></td>
                  <td><span className={`admin-order-page__status admin-order-page__status--${order.orderStatus || 'pending'}`}>{statusLabels[order.orderStatus] || 'Chưa cập nhật'}</span></td>
                  <td><Button variant="secondary" size="sm" icon={<Eye size={15} aria-hidden="true" />} onClick={() => openDetail(order)}>Chi tiết</Button></td>
                </tr>
              })}</tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && visibleOrders.length > 0 && pagination.totalPages > 1 && <div className="admin-order-page__pagination"><Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => loadOrders(pagination.page - 1)} icon={<ChevronLeft size={15} aria-hidden="true" />}>Trang trước</Button><span>Trang {pagination.page} / {pagination.totalPages}</span><Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => loadOrders(pagination.page + 1)} icon={<ChevronRight size={15} aria-hidden="true" />} iconPosition="right">Trang sau</Button></div>}
      </Card>

      <Modal open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} title={`Chi tiết đơn hàng #${selectedOrder?.orderCode || selectedOrder?._id || ''}`} description={selectedOrder ? `${statusLabels[selectedOrder.orderStatus] || 'Chưa cập nhật'} · ${formatDate(selectedOrder.createdAt)}` : ''} size="lg">
        {selectedOrder && <OrderDetail
          order={selectedOrder}
          isLoading={isDetailLoading}
          nextStatus={nextOrderStatus[selectedOrder.orderStatus]}
          isUpdatingStatus={isUpdatingStatus}
          onAdvanceStatus={() => advanceOrderStatus(selectedOrder)}
        />}
      </Modal>
    </div>
  )
}

function OrderDetail({ order, isLoading, nextStatus, isUpdatingStatus, onAdvanceStatus }) {
  const customer = getCustomer(order)
  if (isLoading) return <div className="admin-order-page__detail-loading"><LoaderCircle className="admin-order-page__spinner" size={24} aria-hidden="true" /> Đang tải chi tiết đơn hàng...</div>

  return <div className="admin-order-page__detail">
    <section className="admin-order-page__detail-section"><p className="admin-order-page__detail-eyebrow">THÔNG TIN NHẬN HÀNG</p><div className="admin-order-page__recipient-grid">
      <div><small>Họ và tên</small><strong>{customer.fullName || customer.name || 'Chưa cập nhật'}</strong></div>
      <div><small>Email</small><strong>{customer.email || 'Chưa cập nhật'}</strong></div>
      <div><small>Số điện thoại</small><strong>{customer.phone || 'Chưa cập nhật'}</strong></div>
      <div><small>Địa chỉ</small><strong>{order.shippingAddress?.addressLine || 'Chưa cập nhật'}</strong></div>
    </div></section>
    <section className="admin-order-page__detail-section"><p className="admin-order-page__detail-eyebrow">SẢN PHẨM</p><div className="admin-order-page__items">{(order.items || []).map((item, index) => <div key={`${item.productId || item.productName || 'item'}-${index}`}><span><strong>{item.productName || 'Sản phẩm'}</strong><small>Số lượng: {item.quantity || 0}</small></span><strong>{formatMoney(Number(item.unitPrice || 0) * Number(item.quantity || 0))}</strong></div>)}</div></section>
    <div className="admin-order-page__detail-total"><span><small>Thanh toán</small><strong>{paymentLabels[order.paymentStatus] || 'Chưa cập nhật'}</strong></span><span><small>Tổng cộng</small><strong>{formatMoney(order.totalAmount)}</strong></span></div>
    {nextStatus && (
      <section className="admin-order-page__status-action">
        {order.orderStatus === 'pending' && order.paymentStatus !== 'paid' && (
          <p>Đơn chỉ có thể xác nhận sau khi thanh toán thành công.</p>
        )}
        <Button
          variant="primary"
          loading={isUpdatingStatus}
          disabled={order.orderStatus === 'pending' && order.paymentStatus !== 'paid'}
          onClick={onAdvanceStatus}
        >
          {nextStatus.label}
        </Button>
      </section>
    )}
  </div>
}

export default AdminListOrder
