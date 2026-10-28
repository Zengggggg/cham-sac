import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpenCheck, Edit3, ListPlus, LockKeyhole, MessageCircleQuestion, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Input from '../../components/ui/Input.jsx'
import { getStoredUser } from '../../services/apiClient.js'
import {
  createMyQuestion,
  createMyQuestionList,
  deleteMyQuestion,
  deleteMyQuestionList,
  listMyQuestionLists,
  listPublicQuestionGroups,
  updateMyQuestion,
  updateMyQuestionList,
} from '../../services/questionService.js'
import './QuestionsPage.scss'

const validQuestion = (value) => value.trim().length >= 3 && value.trim().length <= 500

export default function QuestionsPage() {
  const user = getStoredUser()
  const canManagePrivate = user?.role === 'user'
  const [publicGroups, setPublicGroups] = useState([])
  const [privateLists, setPrivateLists] = useState([])
  const [activeSiteId, setActiveSiteId] = useState('')
  const [newList, setNewList] = useState({ name: '', heritageSiteId: '' })
  const [newQuestions, setNewQuestions] = useState({})
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const activeGroup = useMemo(
    () => publicGroups.find((group) => group.heritageSiteId === activeSiteId) || publicGroups[0],
    [activeSiteId, publicGroups],
  )

  const loadPrivateLists = useCallback(async () => {
    if (!canManagePrivate) return
    const response = await listMyQuestionLists()
    setPrivateLists(response.data || [])
  }, [canManagePrivate])

  const loadPage = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [publicResponse] = await Promise.all([
        listPublicQuestionGroups(),
        loadPrivateLists(),
      ])
      const groups = publicResponse.data || []
      setPublicGroups(groups)
      setActiveSiteId((current) => current || groups[0]?.heritageSiteId || '')
      setNewList((current) => ({
        ...current,
        heritageSiteId: current.heritageSiteId || groups[0]?.heritageSiteId || '',
      }))
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách câu hỏi.')
    } finally {
      setLoading(false)
    }
  }, [loadPrivateLists])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadPage() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadPage])

  const runPrivateMutation = async (mutation, successMessage) => {
    setBusy(true)
    try {
      const response = await mutation()
      toast.success(response.message || successMessage)
      await loadPrivateLists()
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể cập nhật câu hỏi private.')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateList = async (event) => {
    event.preventDefault()
    if (newList.name.trim().length < 2 || !newList.heritageSiteId) {
      toast.error('Nhập tên danh sách và chọn địa danh.')
      return
    }
    await runPrivateMutation(
      () => createMyQuestionList({
        name: newList.name.trim(),
        heritageSiteId: newList.heritageSiteId,
      }),
      'Đã tạo danh sách câu hỏi.',
    )
    setNewList((current) => ({ ...current, name: '' }))
  }

  const handleRenameList = async (list) => {
    const name = window.prompt('Tên mới của danh sách', list.name)
    if (name === null || name.trim() === list.name) return
    if (name.trim().length < 2 || name.trim().length > 100) {
      toast.error('Tên danh sách phải có từ 2 đến 100 ký tự.')
      return
    }
    await runPrivateMutation(
      () => updateMyQuestionList(list.id, { name: name.trim() }),
      'Đã đổi tên danh sách.',
    )
  }

  const handleDeleteList = async (list) => {
    if (!window.confirm(`Xóa danh sách “${list.name}” và toàn bộ câu hỏi bên trong?`)) return
    await runPrivateMutation(
      () => deleteMyQuestionList(list.id),
      'Đã xóa danh sách.',
    )
  }

  const handleAddQuestion = async (event, listId) => {
    event.preventDefault()
    const content = newQuestions[listId] || ''
    if (!validQuestion(content)) {
      toast.error('Câu hỏi phải có từ 3 đến 500 ký tự.')
      return
    }
    await runPrivateMutation(
      () => createMyQuestion(listId, content.trim()),
      'Đã thêm câu hỏi.',
    )
    setNewQuestions((current) => ({ ...current, [listId]: '' }))
  }

  const handleEditQuestion = async (listId, question) => {
    const content = window.prompt('Chỉnh sửa câu hỏi', question.content)
    if (content === null || content.trim() === question.content) return
    if (!validQuestion(content)) {
      toast.error('Câu hỏi phải có từ 3 đến 500 ký tự.')
      return
    }
    await runPrivateMutation(
      () => updateMyQuestion(listId, question.id, content.trim()),
      'Đã cập nhật câu hỏi.',
    )
  }

  const handleDeleteQuestion = async (listId, question) => {
    if (!window.confirm(`Xóa câu hỏi “${question.content}”?`)) return
    await runPrivateMutation(
      () => deleteMyQuestion(listId, question.id),
      'Đã xóa câu hỏi.',
    )
  }

  return (
    <main className="questions-page">
      <div className="questions-page__shell">
        <header className="questions-page__hero">
          <p><MessageCircleQuestion size={18} aria-hidden="true" /> KHÁM PHÁ DI SẢN</p>
          <h1>Câu hỏi theo địa danh</h1>
          <span>Tham khảo câu hỏi public và tự xây dựng bộ câu hỏi private cho hành trình của bạn.</span>
        </header>

        {loading ? (
          <div className="questions-page__state" role="status">Đang tải câu hỏi...</div>
        ) : error ? (
          <div className="questions-page__state" role="alert">
            <strong>Không thể tải dữ liệu</strong>
            <p>{error}</p>
            <Button size="sm" onClick={loadPage}>Thử lại</Button>
          </div>
        ) : (
          <>
            <section className="questions-page__section" aria-labelledby="public-questions-title">
              <div className="questions-page__section-heading">
                <div>
                  <p>THƯ VIỆN CHUNG</p>
                  <h2 id="public-questions-title">Câu hỏi public</h2>
                </div>
                {publicGroups.length > 0 && (
                  <label>
                    <span>Địa danh</span>
                    <select
                      value={activeGroup?.heritageSiteId || ''}
                      onChange={(event) => {
                        setActiveSiteId(event.target.value)
                        setRevealedAnswers({})
                        setSelectedAnswers({})
                      }}
                    >
                      {publicGroups.map((group) => <option key={group.heritageSiteId} value={group.heritageSiteId}>{group.name}</option>)}
                    </select>
                  </label>
                )}
              </div>

              {!activeGroup ? (
                <Card className="questions-page__empty">Chưa có địa danh nào có câu hỏi public.</Card>
              ) : (
                <Card className="questions-page__public-card">
                  <div className="questions-page__site-intro">
                    <BookOpenCheck size={26} aria-hidden="true" />
                    <div><h3>{activeGroup.name}</h3><p>{activeGroup.shortDescription}</p></div>
                  </div>
                  {activeGroup.questions.length > 0 ? (
                    <ol className="questions-page__question-list">
                      {activeGroup.questions.map((question) => {
                        const isRevealed = Boolean(revealedAnswers[question.id])
                        const selectedOptionIndex = selectedAnswers[question.id]
                        const isAnswered = Number.isInteger(selectedOptionIndex)
                        const isCorrect = selectedOptionIndex === question.correctOptionIndex
                        return (
                          <li key={question.id}>
                            <p>{question.content}</p>
                            {question.options?.length > 0 && (
                              <>
                                <ul className="questions-page__answer-options">
                                  {question.options.map((option, optionIndex) => (
                                    <li
                                      className={[
                                        (isRevealed || isAnswered) && optionIndex === question.correctOptionIndex ? 'is-correct' : '',
                                        isAnswered && optionIndex === selectedOptionIndex && !isCorrect ? 'is-incorrect' : '',
                                      ].filter(Boolean).join(' ')}
                                      key={`${question.id}-${optionIndex}`}
                                    >
                                      <button
                                        type="button"
                                        disabled={isAnswered}
                                        aria-pressed={selectedOptionIndex === optionIndex}
                                        onClick={() => setSelectedAnswers((current) => ({
                                          ...current,
                                          [question.id]: optionIndex,
                                        }))}
                                      >
                                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                                        <p>{option}</p>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                                {isAnswered ? (
                                  <p className={`questions-page__answer-feedback ${isCorrect ? 'is-correct' : 'is-incorrect'}`} role="status">
                                    {isCorrect ? 'Chính xác!' : 'Chưa đúng. Đáp án đúng đã được đánh dấu.'}
                                  </p>
                                ) : (
                                  <button
                                    className="questions-page__reveal-answer"
                                    type="button"
                                    aria-expanded={isRevealed}
                                    onClick={() => setRevealedAnswers((current) => ({
                                      ...current,
                                      [question.id]: !current[question.id],
                                    }))}
                                  >
                                    {isRevealed ? 'Ẩn đáp án' : 'Xem đáp án'}
                                  </button>
                                )}
                              </>
                            )}
                          </li>
                        )
                      })}
                    </ol>
                  ) : (
                    <p className="questions-page__empty-copy">Admin chưa thêm câu hỏi public cho địa danh này.</p>
                  )}
                </Card>
              )}
            </section>

            <section className="questions-page__section" aria-labelledby="private-questions-title">
              <div className="questions-page__section-heading">
                <div><p>KHÔNG GIAN CÁ NHÂN</p><h2 id="private-questions-title">Danh sách private của bạn</h2></div>
              </div>

              {!user ? (
                <Card className="questions-page__private-gate">
                  <LockKeyhole size={28} aria-hidden="true" />
                  <div><h3>Đăng nhập để tạo danh sách riêng</h3><p>Các danh sách này chỉ bạn mới có thể xem và chỉnh sửa.</p></div>
                  <Button as={Link} to="/login">Đăng nhập</Button>
                </Card>
              ) : !canManagePrivate ? (
                <Card className="questions-page__private-gate">
                  <MessageCircleQuestion size={28} aria-hidden="true" />
                  <div><h3>Tài khoản quản trị</h3><p>Hãy dùng khu vực quản trị để tạo câu hỏi public cho địa danh.</p></div>
                  <Button as={Link} to="/admin/questions">Quản lý câu hỏi</Button>
                </Card>
              ) : (
                <>
                  <Card className="questions-page__create-list">
                    <form onSubmit={handleCreateList}>
                      <Input value={newList.name} onChange={(event) => setNewList((current) => ({ ...current, name: event.target.value }))} placeholder="Tên danh sách, ví dụ: Câu hỏi chuyến đi Hà Nội" maxLength={100} required />
                      <select value={newList.heritageSiteId} onChange={(event) => setNewList((current) => ({ ...current, heritageSiteId: event.target.value }))} required>
                        {publicGroups.map((group) => <option key={group.heritageSiteId} value={group.heritageSiteId}>{group.name}</option>)}
                      </select>
                      <Button type="submit" icon={<ListPlus size={17} aria-hidden="true" />} loading={busy} disabled={!publicGroups.length}>Tạo danh sách</Button>
                    </form>
                  </Card>

                  {privateLists.length === 0 ? (
                    <Card className="questions-page__empty">Bạn chưa có danh sách câu hỏi private nào.</Card>
                  ) : (
                    <div className="questions-page__private-grid">
                      {privateLists.map((list) => (
                        <Card className="questions-page__private-card" key={list.id}>
                          <header>
                            <div><span>{list.heritageSite.name}</span><h3>{list.name}</h3></div>
                            <div>
                              <button type="button" onClick={() => handleRenameList(list)} disabled={busy} aria-label={`Đổi tên ${list.name}`}><Edit3 size={16} /></button>
                              <button type="button" onClick={() => handleDeleteList(list)} disabled={busy} aria-label={`Xóa ${list.name}`}><Trash2 size={16} /></button>
                            </div>
                          </header>
                          {list.questions.length > 0 ? (
                            <ul>
                              {list.questions.map((question) => (
                                <li key={question.id}>
                                  <span>{question.content}</span>
                                  <div>
                                    <button type="button" onClick={() => handleEditQuestion(list.id, question)} disabled={busy} aria-label="Sửa câu hỏi"><Edit3 size={15} /></button>
                                    <button type="button" onClick={() => handleDeleteQuestion(list.id, question)} disabled={busy} aria-label="Xóa câu hỏi"><Trash2 size={15} /></button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="questions-page__empty-copy">Danh sách này chưa có câu hỏi.</p>}
                          <form className="questions-page__add-question" onSubmit={(event) => handleAddQuestion(event, list.id)}>
                            <Input value={newQuestions[list.id] || ''} onChange={(event) => setNewQuestions((current) => ({ ...current, [list.id]: event.target.value }))} placeholder="Nhập câu hỏi mới" maxLength={500} required />
                            <Button type="submit" size="sm" icon={<Plus size={15} />} loading={busy}>Thêm</Button>
                          </form>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
