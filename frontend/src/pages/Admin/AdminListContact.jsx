import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  Clock3,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import { getContacts, updateContactStatus } from '../../services/contactService.js'
import './AdminListContact.scss'

const PAGE_SIZE = 6

const getErrorMessage = (error) => error?.message || 'Không thể tải danh sách liên hệ.'

const formatDate = (date) => date
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
  : 'Chưa cập nhật'

function AdminListContact() {
  const [contacts, setContacts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingContactId, setUpdatingContactId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const loadContacts = useCallback(async (requestedPage = 1) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getContacts({
        page: requestedPage,
        pageSize: PAGE_SIZE,
        search: searchTerm,
        sort: sortOrder,
        status: statusFilter === 'all' ? '' : statusFilter,
      })
      const data = response?.data || {}

      setContacts(data.contacts || [])
      setPagination(data.pagination || {
        page: requestedPage,
        pageSize: PAGE_SIZE,
        total: data.contacts?.length || 0,
        totalPages: 1,
      })
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setContacts([])
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, sortOrder, statusFilter])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadContacts(1)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadContacts])

  const handleSearch = (event) => {
    event.preventDefault()
    setSearchTerm(searchInput.trim())
  }

  const handleStatusChange = async (contact) => {
    if (updatingContactId) return

    setUpdatingContactId(contact._id)
    try {
      const response = await updateContactStatus(contact._id, !contact.isContactted)
      const updatedContact = response?.data?.contact

      if (updatedContact) {
        setContacts((current) => current.map((item) => (
          item._id === contact._id ? updatedContact : item
        )))
      } else {
        await loadContacts(pagination.page)
      }

      toast.success(contact.isContactted ? 'Đã chuyển liên hệ về trạng thái chờ xử lý.' : 'Đã đánh dấu liên hệ đã xử lý.')
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setUpdatingContactId(null)
    }
  }

  const totalContacts = pagination.total ?? contacts.length

  return (
    <div className="admin-contact-page">
      <header className="admin-contact-page__hero">
        <div>
          <p className="admin-contact-page__eyebrow">
            <MessageSquareText size={16} aria-hidden="true" /> HỖ TRỢ VÀ LIÊN HỆ
          </p>
          <h1>Liên hệ</h1>
          <p className="admin-contact-page__lead">
            Theo dõi các câu hỏi và lời nhắn được gửi từ không gian liên hệ của Chạm Sắc Việt.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={<RefreshCw size={17} aria-hidden="true" />}
          onClick={() => loadContacts(pagination.page)}
          loading={isLoading}
        >
          Làm mới
        </Button>
      </header>

      <div className="admin-contact-page__meta">
        <span><MessageSquareText size={16} aria-hidden="true" /> Dữ liệu liên hệ từ website</span>
        <small>{totalContacts} liên hệ</small>
      </div>

      <Card className="admin-contact-page__card">
        <div className="admin-contact-page__toolbar">
          <div className="admin-contact-page__summary">
            <strong>{totalContacts}</strong>
            <span>liên hệ</span>
          </div>

          <div className="admin-contact-page__filters">
            <form className="admin-contact-page__search" onSubmit={handleSearch}>
              <Search size={17} aria-hidden="true" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên, email hoặc chủ đề"
                aria-label="Tìm kiếm liên hệ"
              />
              <Button type="submit" size="sm" icon={<Search size={15} aria-hidden="true" />}>
                Tìm kiếm
              </Button>
            </form>

            <label className="admin-contact-page__select">
              <span>Trạng thái</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tất cả</option>
                <option value="pending">Chờ xử lý</option>
                <option value="done">Đã xử lý</option>
              </select>
            </label>

            <label className="admin-contact-page__select">
              <span>Thời gian</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-contact-page__state" role="status">
            <LoaderCircle className="admin-contact-page__spinner" size={28} aria-hidden="true" />
            <strong>Đang tải danh sách liên hệ</strong>
          </div>
        ) : error ? (
          <div className="admin-contact-page__state admin-contact-page__state--error" role="alert">
            <AlertCircle size={28} aria-hidden="true" />
            <strong>Không thể tải dữ liệu liên hệ</strong>
            <p>{error}</p>
            <Button size="sm" onClick={() => loadContacts(pagination.page)} icon={<RefreshCw size={15} aria-hidden="true" />}>
              Thử lại
            </Button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="admin-contact-page__state" role="status">
            <MessageSquareText size={28} aria-hidden="true" />
            <strong>Chưa có liên hệ nào</strong>
            <p>Các lời nhắn gửi từ trang Liên hệ sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="admin-contact-page__table-wrap">
            <table className="admin-contact-page__table">
              <thead>
                <tr>
                  <th>Người gửi</th>
                  <th>Chủ đề</th>
                  <th>Nội dung</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact._id}>
                    <td>
                      <div className="admin-contact-page__sender">
                        <span className="admin-contact-page__sender-icon"><UserRound size={17} aria-hidden="true" /></span>
                        <strong>{contact.receiverName || 'Chưa cập nhật'}</strong>
                        <span><Phone size={13} aria-hidden="true" /> {contact.phone || 'Chưa cập nhật'}</span>
                        <span><Mail size={13} aria-hidden="true" /> {contact.email || 'Chưa cập nhật'}</span>
                      </div>
                    </td>
                    <td>
                      <strong className="admin-contact-page__topic">{contact.topic || 'Chưa cập nhật'}</strong>
                      <small className="admin-contact-page__date"><Clock3 size={13} aria-hidden="true" /> {formatDate(contact.createdAt)}</small>
                    </td>
                    <td><p className="admin-contact-page__message">{contact.message || 'Không có nội dung.'}</p></td>
                    <td>
                      <span className={`admin-contact-page__status ${contact.isContactted ? 'admin-contact-page__status--done' : 'admin-contact-page__status--pending'}`}>
                        {contact.isContactted ? 'Đã xử lý' : 'Chờ xử lý'}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant={contact.isContactted ? 'secondary' : 'primary'}
                        size="sm"
                        loading={updatingContactId === contact._id}
                        icon={<Check size={15} aria-hidden="true" />}
                        onClick={() => handleStatusChange(contact)}
                      >
                        {contact.isContactted ? 'Đánh dấu chờ xử lý' : 'Đánh dấu đã xử lý'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && contacts.length > 0 && pagination.totalPages > 1 && (
          <div className="admin-contact-page__pagination">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => loadContacts(pagination.page - 1)}
            >
              Trang trước
            </Button>
            <span>Trang {pagination.page} / {pagination.totalPages}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadContacts(pagination.page + 1)}
            >
              Trang sau
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminListContact
