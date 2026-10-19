import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Archive,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  RefreshCw,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import { getDashboard } from '../../services/adminService.js'
import './AdminDashboard.scss'

const workItems = [
  { label: 'Sản phẩm và nội dung', value: 'Đã kết nối dữ liệu quản trị', icon: Archive },
  { label: 'Người dùng', value: 'Đã kết nối dữ liệu quản trị', icon: Activity },
  { label: 'Đơn hàng mới', value: 'Đã kết nối dữ liệu quản trị', icon: ClipboardList },
]

function AdminDashboard() {
  const [lastUpdated, setLastUpdated] = useState('Chưa cập nhật')
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getDashboard()
      setDashboard(response.data)
      setLastUpdated(new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date()))
    } catch (error) {
      toast.error(error.message || 'Không thể tải dữ liệu tổng quan.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void handleRefresh() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [handleRefresh])

  const summary = dashboard?.summary || {}
  const dashboardStats = [
    { label: 'Người dùng', value: isLoading ? '…' : summary.totalUsers ?? 0, hint: 'Tổng tài khoản', icon: UsersRound, tone: 'pink' },
    { label: 'Đơn hàng', value: isLoading ? '…' : summary.totalOrders ?? 0, hint: `${summary.pendingOrders ?? 0} đơn đang chờ`, icon: ClipboardList, tone: 'blue' },
    { label: 'Sản phẩm', value: isLoading ? '…' : summary.totalProducts ?? 0, hint: 'Trong hệ thống', icon: FileText, tone: 'gold' },
    { label: 'Doanh thu', value: isLoading ? '…' : new Intl.NumberFormat('vi-VN').format(summary.totalRevenue ?? 0), hint: 'VND đã thanh toán', icon: Sparkles, tone: 'turquoise' },
  ]

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__hero">
        <div>
          <p className="admin-dashboard__eyebrow">BẢNG ĐIỀU HÀNH · CHẠM SẮC VIỆT</p>
          <h1>Tổng quan hệ thống</h1>
          <p className="admin-dashboard__lead">Quản lý nội dung, người dùng và hành trình khám phá di sản trong một không gian.</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={17} aria-hidden="true" />} onClick={handleRefresh} loading={isLoading}>
          Làm mới
        </Button>
      </header>

      <div className="admin-dashboard__meta">
        <span><CheckCircle2 size={16} aria-hidden="true" /> Giao diện quản trị sẵn sàng</span>
        <small>Cập nhật lần cuối: {lastUpdated}</small>
      </div>

      <section className="admin-dashboard__stats" aria-label="Chỉ số tổng quan">
        {dashboardStats.map(({ label, value, hint, icon: Icon, tone }) => (
          <Card className={`admin-dashboard__stat admin-dashboard__stat--${tone}`} key={label} title={label}>
            <div className="admin-dashboard__stat-body">
              <span className="admin-dashboard__stat-icon"><Icon size={20} aria-hidden="true" /></span>
              <strong>{value}</strong>
              <p>{hint}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="admin-dashboard__grid">
        <Card
          className="admin-dashboard__panel admin-dashboard__panel--wide"
          eyebrow="TỔNG QUAN DỮ LIỆU"
          title="Nhịp vận hành theo thời gian"
          description="Khu vực biểu đồ sẽ hiển thị khi hệ thống nhận dữ liệu quản trị."
          actions={<Button variant="ghost" size="sm" onClick={() => toast('Bộ lọc thời gian sẽ được kết nối sau.')}>Bộ lọc thời gian <ArrowUpRight size={15} aria-hidden="true" /></Button>}
        >
          <div className="admin-dashboard__empty-chart">
            <div className="admin-dashboard__chart-lines" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="admin-dashboard__chart-message">
              <span className="admin-dashboard__chart-mark"><Activity size={22} aria-hidden="true" /></span>
              <strong>Chưa có dữ liệu để hiển thị</strong>
              <p>Kết nối API để theo dõi các chỉ số hoạt động theo ngày.</p>
            </div>
          </div>
        </Card>

        <Card
          className="admin-dashboard__panel"
          eyebrow="CẦN QUAN TÂM"
          title="Các khu vực quản lý"
          description="Tổng hợp nhanh các nhóm dữ liệu trong hệ thống."
        >
          <div className="admin-dashboard__work-list">
            {workItems.map(({ label, value, icon: Icon }) => (
              <div className="admin-dashboard__work-item" key={label}>
                <span><Icon size={18} aria-hidden="true" /></span>
                <div><strong>{label}</strong><small>{value}</small></div>
                <ArrowUpRight size={16} aria-hidden="true" />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="admin-dashboard__bottom-grid">
        <Card className="admin-dashboard__status-card" eyebrow="TRẠNG THÁI HỆ THỐNG" title="Sẵn sàng cho bước kết nối tiếp theo">
          <div className="admin-dashboard__status-content">
            <div className="admin-dashboard__status-badge"><CheckCircle2 size={20} aria-hidden="true" /></div>
            <div><strong>Frontend quản trị đã được cấu hình</strong><p>Các vùng nội dung đang dùng trạng thái chờ dữ liệu để tránh hiển thị số liệu giả.</p></div>
          </div>
        </Card>
        <Card className="admin-dashboard__shortcut-card" eyebrow="LỐI TẮT" title="Tiếp tục xây dựng">
          <p>Chọn một mục ở thanh bên để mở rộng từng khu vực quản lý.</p>
          <Button variant="primary" size="sm" onClick={() => toast('Các module quản trị sẽ được triển khai theo từng bước.')}>Xem hướng dẫn <ArrowUpRight size={15} aria-hidden="true" /></Button>
        </Card>
      </section>
    </div>
  )
}

export default AdminDashboard
