import { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter, RefreshCw, Search, ShieldCheck, UsersRound } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import { listUsers, updateUserStatus } from '../../services/adminService.js'
import './AdminListUser.scss'

function AdminListUser() {
  const [users, setUsers] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastUpdated, setLastUpdated] = useState('Chưa cập nhật')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await listUsers({ search: searchTerm, status: statusFilter === 'all' ? '' : statusFilter })
      setUsers(response.data || [])
      setLastUpdated(new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date()))
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách người dùng.')
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, statusFilter])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadUsers() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadUsers])

  const visibleUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch = !normalizedSearch || [user.name, user.email, user.phone]
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
      return matchesSearch
    })
  }, [searchTerm, users])

  const handleSearch = (event) => {
    event.preventDefault()
    setSearchTerm(searchInput)
  }

  const handleRefresh = () => { void loadUsers() }

  const toggleStatus = async (user) => {
    try {
      const status = user.status === 'blocked' ? 'active' : 'blocked'
      await updateUserStatus(user.id || user._id, status, user.updatedAt)
      toast.success(status === 'blocked' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
      await loadUsers()
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể cập nhật tài khoản.')
    }
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
          loading={isLoading}
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
                <option value="blocked">Đã khóa</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-user-page__empty" role="status"><strong>Đang tải danh sách người dùng</strong></div>
        ) : error ? (
          <div className="admin-user-page__empty" role="alert"><strong>Không thể tải dữ liệu</strong><p>{error}</p><Button size="sm" onClick={handleRefresh}>Thử lại</Button></div>
        ) : visibleUsers.length === 0 ? (
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
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id || user._id}>
                    <td><strong>{user.fullName || user.name}</strong></td>
                    <td>{user.email}<small>{user.phone || 'Chưa cập nhật'}</small></td>
                    <td>{user.role}</td>
                    <td><span className={`admin-user-page__status admin-user-page__status--${user.status}`}>{user.status === 'blocked' ? 'Đã khóa' : user.status === 'pending_verification' ? 'Chờ xác minh' : 'Đang hoạt động'}</span></td>
                    <td>{user.role === 'user' && <Button size="sm" variant="secondary" onClick={() => toggleStatus(user)}>{user.status === 'blocked' ? 'Mở khóa' : 'Khóa'}</Button>}</td>
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
