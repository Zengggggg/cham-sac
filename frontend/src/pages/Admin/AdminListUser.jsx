import { useMemo, useState } from 'react'
import { Filter, RefreshCw, Search, ShieldCheck, UsersRound } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import './AdminListUser.scss'

const emptyUsers = []

function AdminListUser() {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastUpdated, setLastUpdated] = useState('Chưa cập nhật')

  const visibleUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return emptyUsers.filter((user) => {
      const matchesSearch = !normalizedSearch || [user.name, user.email, user.phone]
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  const handleSearch = (event) => {
    event.preventDefault()
    setSearchTerm(searchInput)
  }

  const handleRefresh = () => {
    setLastUpdated(new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date()))
    toast('Dữ liệu người dùng sẽ hiển thị khi API quản trị được kết nối.')
  }

  return (
    <div className="admin-user-page">
      <header className="admin-user-page__hero">
        <div>
          <p className="admin-user-page__eyebrow">
            <ShieldCheck size={16} aria-hidden="true" /> QUẢN LÝ NGƯỜI DÙNG
          </p>
          <h1>Người dùng</h1>
          <p className="admin-user-page__lead">
            Theo dõi tài khoản, trạng thái hoạt động và thông tin liên hệ trong hệ thống.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={<RefreshCw size={17} aria-hidden="true" />}
          onClick={handleRefresh}
        >
          Làm mới
        </Button>
      </header>

      <div className="admin-user-page__meta">
        <span><ShieldCheck size={16} aria-hidden="true" /> Khu vực quản trị sẵn sàng</span>
        <small>Cập nhật lần cuối: {lastUpdated}</small>
      </div>

      <Card className="admin-user-page__card">
        <div className="admin-user-page__toolbar">
          <div className="admin-user-page__summary">
            <span className="admin-user-page__summary-icon"><UsersRound size={20} aria-hidden="true" /></span>
            <div>
              <strong>{visibleUsers.length}</strong>
              <span>tài khoản hiển thị</span>
            </div>
          </div>

          <div className="admin-user-page__filters">
            <form className="admin-user-page__search" onSubmit={handleSearch}>
              <Search size={17} aria-hidden="true" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên hoặc email"
                aria-label="Tìm kiếm người dùng"
              />
              <Button type="submit" size="sm" icon={<Search size={15} aria-hidden="true" />}>
                Tìm kiếm
              </Button>
            </form>

            <label className="admin-user-page__select">
              <Filter size={16} aria-hidden="true" />
              <span>Trạng thái</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="disabled">Đã khóa</option>
              </select>
            </label>
          </div>
        </div>

        {visibleUsers.length === 0 ? (
          <div className="admin-user-page__empty" role="status">
            <span className="admin-user-page__empty-icon"><UsersRound size={25} aria-hidden="true" /></span>
            <strong>Chưa có dữ liệu người dùng</strong>
            <p>Danh sách tài khoản sẽ xuất hiện tại đây sau khi API quản trị được kết nối.</p>
          </div>
        ) : (
          <div className="admin-user-page__table-wrap">
            <table className="admin-user-page__table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Liên hệ</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}<small>{user.phone}</small></td>
                    <td>{user.role}</td>
                    <td><span className={`admin-user-page__status admin-user-page__status--${user.status}`}>{user.statusLabel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminListUser
