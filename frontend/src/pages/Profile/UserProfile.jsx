import { useState } from 'react'
import { Edit3, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import authCover from '../../assets/pics/auth_cover.png'
import './UserProfile.scss'

const initialProfile = {
  name: 'Người khám phá',
  fullName: 'Người khám phá',
  email: 'you@example.com',
  phone: 'Chưa cập nhật',
  avatarUrl: '',
  role: 'user',
  status: 'active',
  emailVerifiedAt: null,
  createdAt: '',
  authProvider: 'local',
}

const formatDate = (value) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : 'Chưa cập nhật'
const roleLabel = (role) => role === 'admin' ? 'Quản trị viên' : 'Thành viên'
const statusLabel = (status) => status === 'blocked' ? 'Đã khóa' : status === 'pending_verification' ? 'Chờ xác minh' : 'Đang hoạt động'
const authProviderLabel = (provider) => provider === 'google' ? 'Google' : 'Email & mật khẩu'
const orderStatusLabel = (status) => ({ pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', done: 'Hoàn tất', cancelled: 'Đã hủy' }[status] || 'Chưa cập nhật')
const paymentStatusLabel = (status) => ({ unpaid: 'Chưa thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền' }[status] || 'Chưa cập nhật')
const formatMoney = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value) || 0)

function readOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem('orders') || localStorage.getItem('userOrders') || '[]')
    return Array.isArray(saved) ? saved : Array.isArray(saved?.data) ? saved.data : []
  } catch {
    return []
  }
}

function readProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem('user') || 'null')
    return saved ? { ...initialProfile, ...saved, fullName: saved.fullName || saved.full_name || saved.name || initialProfile.fullName, authProvider: saved.authProvider || (saved.googleId ? 'google' : 'local') } : initialProfile
  } catch {
    return initialProfile
  }
}

export default function UserProfile() {
  const [profile, setProfile] = useState(readProfile)
  const [draft, setDraft] = useState(profile)
  const [orders] = useState(readOrders)
  const [isEditing, setIsEditing] = useState(false)

  const handleChange = ({ target }) => setDraft((current) => ({ ...current, [target.name]: target.value }))
  const handleSave = (event) => {
    event.preventDefault()
    const updated = { ...profile, ...draft }
    setProfile(updated)
    setDraft(updated)
    localStorage.setItem('user', JSON.stringify(updated))
    setIsEditing(false)
    toast.success('Đã cập nhật hồ sơ')
  }
  const cancelEdit = () => { setDraft(profile); setIsEditing(false) }

  return (
    <main className="profile-page">
      <div className="profile-page__shell">
        <header className="profile-page__header">
          <div>
            <p className="profile-page__eyebrow">Không gian cá nhân</p>
            <h1>Hồ sơ của bạn</h1>
            <p>Quản lý thông tin và tiếp tục hành trình khám phá di sản.</p>
          </div>
          <div className="profile-page__header-actions">
            {isEditing && <Button type="submit" form="profile-details-form" icon={<Save size={17} />}>Lưu thay đổi</Button>}
            <Button variant="secondary" icon={isEditing ? <X size={17} /> : <Edit3 size={17} />} onClick={isEditing ? cancelEdit : () => setIsEditing(true)}>
              {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
            </Button>
          </div>
        </header>

        <section className="profile-page__grid">
          <Card className="profile-page__summary">
            <div className="profile-page__avatar">
              <img src={profile.avatarUrl || authCover} alt={`Ảnh đại diện của ${profile.fullName}`} />
            </div>
            <h2>{profile.fullName}</h2>
            <p className="profile-page__email">{profile.email}</p>
            <div className="profile-page__summary-badges">
              <span className={`profile-page__badge profile-page__badge--${profile.status}`}><i /> {statusLabel(profile.status)}</span>
              <span className={`profile-page__role-badge profile-page__role-badge--${profile.role}`}>{roleLabel(profile.role)}</span>
            </div>
            <div className="profile-page__summary-info">
              <div><span>Số điện thoại</span><strong>{profile.phone}</strong></div>
              <div><span>Email</span><strong>{profile.email}</strong></div>
            </div>
          </Card>

          <Card className="profile-page__details" title="Thông tin cá nhân" description="Thông tin giúp bạn quản lý trải nghiệm trên Chạm Sắc Việt.">
            <form id="profile-details-form" onSubmit={handleSave}>
              <div className="profile-page__fields">
                <label>Họ và tên{isEditing ? <Input name="fullName" value={draft.fullName} onChange={handleChange} required /> : <strong>{profile.fullName}</strong>}</label>
                <label>Email<strong>{profile.email}</strong></label>
                <label>Số điện thoại{isEditing ? <Input name="phone" value={draft.phone} onChange={handleChange} placeholder="Nhập số điện thoại" /> : <strong>{profile.phone}</strong>}</label>
                <label>Vai trò<strong>{roleLabel(profile.role)}</strong></label>
                <label>Phương thức đăng nhập<strong>{authProviderLabel(profile.authProvider)}</strong></label>
                <label>Ngày tham gia<strong>{formatDate(profile.createdAt)}</strong></label>
              </div>
              <div className="profile-page__verification"><span>Trạng thái email</span><strong>{profile.emailVerifiedAt ? 'Đã xác minh' : 'Chưa xác minh'}</strong></div>
            </form>
          </Card>
        </section>

        <section className="profile-page__lower-grid">
          <Card className="profile-page__orders" eyebrow="Mua sắm" title="Đơn hàng của tôi" description="Theo dõi sản phẩm, trạng thái thanh toán và tiến trình giao hàng của bạn." actions={!orders.length && <Button variant="secondary" size="sm" onClick={() => toast('Danh sách sản phẩm sẽ được kết nối trong bước tiếp theo')}>Khám phá sản phẩm</Button>}>
            {orders.length > 0 ? <div className="profile-page__orders-list">{orders.map((order) => <article className="profile-page__order" key={order._id || order.orderCode}>
              <div className="profile-page__order-head"><strong>#{order.orderCode || 'Chưa có mã'}</strong><span>{formatDate(order.createdAt)}</span></div>
              <ul className="profile-page__order-items">{(order.items || []).map((item, index) => <li key={`${item.productId || item.productName || 'item'}-${index}`}><span>{item.productName || 'Sản phẩm'} × {item.quantity || 0}</span><strong>{formatMoney((item.unitPrice || 0) * (item.quantity || 0))}</strong></li>)}</ul>
              <div className="profile-page__order-meta"><span className={`profile-page__order-status profile-page__order-status--${order.orderStatus || 'pending'}`}>{orderStatusLabel(order.orderStatus)}</span><span>{paymentStatusLabel(order.paymentStatus)}</span><strong>{formatMoney(order.totalAmount)}</strong></div>
            </article>)}</div> : <div className="profile-page__empty"><p>Bạn chưa có đơn hàng nào.</p></div>}
          </Card>
          <Card eyebrow="Cộng đồng" title="Câu hỏi của tôi" description="Theo dõi các câu hỏi bạn đã tạo về những câu chuyện di sản." actions={<Button variant="secondary" size="sm" onClick={() => toast('Khu vực câu hỏi sẽ được kết nối trong bước tiếp theo')}>Xem câu hỏi</Button>}>
            <p className="profile-page__card-copy">Chưa có câu hỏi nào được đồng bộ.</p>
          </Card>
        </section>
      </div>
    </main>
  )
}
