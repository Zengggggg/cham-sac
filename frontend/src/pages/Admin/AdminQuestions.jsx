import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Edit3, Landmark, MessageCircleQuestion, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import {
  createAdminPublicQuestion,
  deleteAdminPublicQuestion,
  getAdminPublicQuestions,
  listAdminHeritageSites,
  updateAdminPublicQuestion,
} from '../../services/adminService.js'
import './AdminQuestions.scss'

const validQuestion = (value) => value.trim().length >= 3 && value.trim().length <= 500

export default function AdminQuestions() {
  const [heritageSites, setHeritageSites] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [group, setGroup] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadQuestions = useCallback(async (heritageSiteId) => {
    if (!heritageSiteId) {
      setGroup(null)
      return
    }
    const response = await getAdminPublicQuestions(heritageSiteId)
    setGroup(response.data.group)
  }, [])

  const loadPage = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listAdminHeritageSites()
      const sites = response.data || []
      setHeritageSites(sites)
      const nextSiteId = sites[0]?.id || sites[0]?._id || ''
      setSelectedSiteId(nextSiteId)
      await loadQuestions(nextSiteId)
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu địa danh.')
    } finally {
      setLoading(false)
    }
  }, [loadQuestions])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadPage() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadPage])

  const selectSite = async (heritageSiteId) => {
    setSelectedSiteId(heritageSiteId)
    setLoading(true)
    setError('')
    try {
      await loadQuestions(heritageSiteId)
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải câu hỏi của địa danh.')
    } finally {
      setLoading(false)
    }
  }

  const runMutation = async (mutation, successMessage) => {
    setBusy(true)
    try {
      const response = await mutation()
      toast.success(response.message || successMessage)
      await loadQuestions(selectedSiteId)
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể cập nhật câu hỏi public.')
      if (requestError.statusCode === 409) await loadQuestions(selectedSiteId).catch(() => undefined)
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!validQuestion(content)) {
      toast.error('Câu hỏi phải có từ 3 đến 500 ký tự.')
      return
    }
    await runMutation(
      () => createAdminPublicQuestion(selectedSiteId, content.trim()),
      'Đã tạo câu hỏi public.',
    )
    setContent('')
  }

  const handleEdit = async (question) => {
    const nextContent = window.prompt('Chỉnh sửa câu hỏi public', question.content)
    if (nextContent === null || nextContent.trim() === question.content) return
    if (!validQuestion(nextContent)) {
      toast.error('Câu hỏi phải có từ 3 đến 500 ký tự.')
      return
    }
    await runMutation(
      () => updateAdminPublicQuestion(
        selectedSiteId,
        question.id,
        nextContent.trim(),
        group.updatedAt,
      ),
      'Đã cập nhật câu hỏi public.',
    )
  }

  const handleDelete = async (question) => {
    if (!window.confirm(`Xóa câu hỏi “${question.content}”?`)) return
    await runMutation(
      () => deleteAdminPublicQuestion(selectedSiteId, question.id, group.updatedAt),
      'Đã xóa câu hỏi public.',
    )
  }

  return (
    <div className="admin-questions-page">
      <header className="admin-questions-page__hero">
        <div>
          <p><MessageCircleQuestion size={17} aria-hidden="true" /> NỘI DUNG DI SẢN</p>
          <h1>Câu hỏi public</h1>
          <span>Tạo và quản lý bộ câu hỏi công khai cho từng địa danh.</span>
        </div>
      </header>

      <div className="admin-questions-page__layout">
        <Card className="admin-questions-page__sites">
          <h2>Địa danh</h2>
          {heritageSites.length === 0 ? <p>Chưa có địa danh.</p> : (
            <nav aria-label="Chọn địa danh">
              {heritageSites.map((site) => {
                const siteId = site.id || site._id
                return (
                  <button className={siteId === selectedSiteId ? 'is-active' : ''} key={siteId} type="button" onClick={() => selectSite(siteId)}>
                    <Landmark size={17} aria-hidden="true" /><span>{site.name}</span>
                  </button>
                )
              })}
            </nav>
          )}
        </Card>

        <section className="admin-questions-page__workspace">
          {loading ? (
            <div className="admin-questions-page__state" role="status">Đang tải câu hỏi...</div>
          ) : error ? (
            <div className="admin-questions-page__state" role="alert"><AlertCircle size={26} /><strong>Không thể tải dữ liệu</strong><p>{error}</p><Button size="sm" onClick={loadPage}>Thử lại</Button></div>
          ) : !group ? (
            <div className="admin-questions-page__state">Chọn một địa danh để quản lý câu hỏi.</div>
          ) : (
            <>
              <Card className="admin-questions-page__composer">
                <div><span>ĐỊA DANH ĐANG CHỌN</span><h2>{group.name}</h2><p>{group.shortDescription}</p></div>
                <form onSubmit={handleCreate}>
                  <Input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Nhập câu hỏi public mới" maxLength={500} required />
                  <Button type="submit" icon={<Plus size={16} />} loading={busy}>Thêm câu hỏi</Button>
                </form>
              </Card>

              <Card className="admin-questions-page__list-card">
                <div className="admin-questions-page__list-heading"><h2>Danh sách câu hỏi</h2><span>{group.questions.length}/100</span></div>
                {group.questions.length === 0 ? (
                  <div className="admin-questions-page__empty">Địa danh này chưa có câu hỏi public.</div>
                ) : (
                  <ol>
                    {group.questions.map((question) => (
                      <li key={question.id}>
                        <span>{question.content}</span>
                        <div>
                          <button type="button" onClick={() => handleEdit(question)} disabled={busy} aria-label="Sửa câu hỏi"><Edit3 size={16} /></button>
                          <button type="button" onClick={() => handleDelete(question)} disabled={busy} aria-label="Xóa câu hỏi"><Trash2 size={16} /></button>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
