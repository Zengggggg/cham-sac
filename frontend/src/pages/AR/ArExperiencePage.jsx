import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Camera, CameraOff, Check, ChevronLeft, ChevronRight, LockKeyhole, MapPin, ScanLine, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import useMindARSession from '../../hooks/useMindARSession.js'
import useArExperiences from '../../hooks/useArExperiences.js'
import './ArExperiencePage.scss'

const statusCopy = {
  loading: 'Đang tải bộ nhận diện MindAR…',
  scanning: 'Đang tìm thẻ địa danh',
}

function CameraFallback({ status, error, onBrowse, onRetry }) {
  const isInsecure = status === 'insecure'
  const isUnsupported = status === 'unsupported'
  const title = isInsecure
    ? 'Cần kết nối an toàn'
    : isUnsupported
      ? 'Thiết bị chưa hỗ trợ camera web'
      : 'Chưa thể mở camera'
  const description = isInsecure
    ? 'Hãy mở trang bằng HTTPS để trình duyệt cho phép sử dụng camera.'
    : isUnsupported
      ? 'Bạn có thể thử lại bằng Safari, Chrome hoặc Edge phiên bản mới nhất trên điện thoại.'
      : error?.message

  return (
    <section className="ar-fallback" role="alert" aria-labelledby="ar-fallback-title">
      <span className="ar-fallback__icon" aria-hidden="true"><CameraOff size={28} /></span>
      <p className="ar-eyebrow">PHƯƠNG ÁN THAY THẾ</p>
      <h1 id="ar-fallback-title">{title}</h1>
      <p>{description}</p>
      {error?.code === 'permission-denied' && (
        <ol className="ar-fallback__steps">
          <li>Chạm biểu tượng ổ khóa cạnh thanh địa chỉ.</li>
          <li>Đổi quyền Camera thành “Cho phép”.</li>
          <li>Quay lại trang và chọn “Thử lại”.</li>
        </ol>
      )}
      <div className="ar-fallback__actions">
        {!isInsecure && !isUnsupported && (
          <button className="ar-button ar-button--primary" type="button" onClick={onRetry}>
            Thử lại
          </button>
        )}
        <Link className="ar-button ar-button--secondary" to="/about-us">
          Khám phá Chạm Sắc Việt
        </Link>
        <button className="ar-button ar-button--ghost" type="button" onClick={onBrowse}>
          <BookOpen size={18} aria-hidden="true" /> Xem 7 địa danh
        </button>
      </div>
    </section>
  )
}

function HeritageCatalog({ experiences, selectedExperience, onClose, onSelect }) {
  return (
    <section className="ar-catalog" role="dialog" aria-modal="true" aria-labelledby="ar-catalog-title">
      <div className="ar-catalog__panel">
        <header className="ar-catalog__header">
          <div>
            <p className="ar-eyebrow">BỘ THẺ ĐANG HỖ TRỢ</p>
            <h2 id="ar-catalog-title">{selectedExperience ? selectedExperience.name : 'Khám phá 7 địa danh'}</h2>
          </div>
          <button className="ar-catalog__close" type="button" onClick={onClose} aria-label="Đóng danh sách địa danh">
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {selectedExperience ? (
          <article className="ar-place-detail">
            <button className="ar-place-detail__back" type="button" onClick={() => onSelect(null)}>
              <ChevronLeft size={18} aria-hidden="true" /> Tất cả địa danh
            </button>
            <div className="ar-place-detail__layout">
              <img src={selectedExperience.targetImage} alt={`Thẻ địa danh ${selectedExperience.name}`} />
              <div className="ar-place-detail__content">
                <span className="ar-place-detail__location"><MapPin size={16} aria-hidden="true" /> {selectedExperience.location}</span>
                <p className="ar-place-detail__tagline">{selectedExperience.tagline}</p>
                <p className="ar-place-detail__summary">{selectedExperience.shortDescription}</p>
                {selectedExperience.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <p className="ar-place-detail__target">Mã nhận diện thử nghiệm: target_index {selectedExperience.targetIndex}</p>
              </div>
            </div>
          </article>
        ) : (
          <>
            <p className="ar-catalog__intro">Chọn một thẻ để xem nội dung văn hóa. Bạn vẫn có thể khám phá phần này khi camera không khả dụng.</p>
            <div className="ar-catalog__grid">
              {experiences.map((experience) => (
                <button className="ar-place-card" type="button" key={experience.id} onClick={() => onSelect(experience)}>
                  <img src={experience.targetImage} alt="" />
                  <span className="ar-place-card__body">
                    <small><MapPin size={13} aria-hidden="true" /> {experience.location}</small>
                    <strong>{experience.name}</strong>
                    <span>{experience.tagline}</span>
                  </span>
                  <ChevronRight className="ar-place-card__arrow" size={20} aria-hidden="true" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function ModelLoadStatus({ modelState, onRetry }) {
  if (modelState.status === 'idle') return null

  if (modelState.status === 'loading') {
    const progressLabel = Number.isFinite(modelState.progress) ? `${modelState.progress}%` : 'đang tải'
    return (
      <div className="ar-model-status" role="status" aria-live="polite">
        <span>Đang tải model 3D · {progressLabel}</span>
        <span className="ar-model-status__track" aria-hidden="true">
          <span style={{ width: Number.isFinite(modelState.progress) ? `${modelState.progress}%` : '35%' }} />
        </span>
      </div>
    )
  }

  if (modelState.status === 'ready') {
    return <p className="ar-model-status ar-model-status--ready">Model 3D đã sẵn sàng trên thẻ.</p>
  }

  if (modelState.status === 'error') {
    return (
      <div className="ar-model-status ar-model-status--error" role="alert">
        <span>{modelState.message}</span>
        <button type="button" onClick={onRetry}>Tải lại model</button>
      </div>
    )
  }

  return <p className="ar-model-status ar-model-status--muted">{modelState.message}</p>
}

function ArExperiencePage() {
  const { experiences } = useArExperiences()
  const {
    containerRef,
    error,
    modelState,
    recognizedExperience,
    retryModel,
    startAR,
    status,
    stopAR,
  } = useMindARSession(experiences)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [selectedExperience, setSelectedExperience] = useState(null)
  const isActive = ['loading', 'scanning', 'recognized'].includes(status)
  const isRequesting = status === 'loading'
  const hasFallback = ['error', 'insecure', 'unsupported'].includes(status)

  useEffect(() => {
    if (!catalogOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setCatalogOpen(false)
        setSelectedExperience(null)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [catalogOpen])

  const openCatalog = () => setCatalogOpen(true)
  const closeCatalog = () => {
    setCatalogOpen(false)
    setSelectedExperience(null)
  }

  return (
    <main className={`ar-page${isActive ? ' ar-page--active' : ''}`}>
      <header className="ar-toolbar">
        <Link className="ar-toolbar__back" to="/" aria-label="Trở về trang chủ">
          <ArrowLeft size={21} aria-hidden="true" />
          <span>Trang chủ</span>
        </Link>
        <div className="ar-toolbar__brand" aria-label="Chạm Sắc Việt">
          <span aria-hidden="true">✦</span> CHẠM SẮC VIỆT
        </div>
        {isActive ? (
          <button className="ar-toolbar__stop" type="button" onClick={stopAR}>
            <CameraOff size={18} aria-hidden="true" /> Dừng camera
          </button>
        ) : <span className="ar-toolbar__spacer" />}
      </header>

      <section className="ar-stage" aria-label="Khu vực trải nghiệm thực tế tăng cường">
        <div
          className="ar-stage__mindar"
          ref={containerRef}
          aria-label="Hình ảnh camera và lớp phủ thực tế tăng cường"
        />

        {isActive && (
          <div className="ar-scanner">
            <div className="ar-scanner__status" role="status" aria-live="polite">
              <span className="ar-scanner__dot" aria-hidden="true" />
              {recognizedExperience ? `Đã nhận diện: ${recognizedExperience.name}` : statusCopy[status]}
            </div>
            <div className={`ar-scanner__frame${recognizedExperience ? ' ar-scanner__frame--recognized' : ''}`} aria-hidden="true">
              <span className="ar-scanner__corner ar-scanner__corner--tl" />
              <span className="ar-scanner__corner ar-scanner__corner--tr" />
              <span className="ar-scanner__corner ar-scanner__corner--bl" />
              <span className="ar-scanner__corner ar-scanner__corner--br" />
              <span className="ar-scanner__line" />
            </div>
            <div className="ar-scanner__guide">
              {recognizedExperience ? (
                <>
                  <Check size={22} aria-hidden="true" />
                  <div>
                    <strong>{recognizedExperience.name}</strong>
                    <span>{recognizedExperience.tagline}</span>
                    <ModelLoadStatus modelState={modelState} onRetry={retryModel} />
                    <button type="button" onClick={() => {
                      setSelectedExperience(recognizedExperience)
                      setCatalogOpen(true)
                    }}>
                      Xem câu chuyện địa danh
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <ScanLine size={22} aria-hidden="true" />
                  <div>
                    <strong>{status === 'loading' ? 'Đang chuẩn bị bộ nhận diện' : 'Đưa hình địa danh vào giữa khung'}</strong>
                    <span>{status === 'loading' ? 'Lần khởi động đầu tiên có thể mất vài giây.' : 'Giữ điện thoại ổn định, đủ sáng và cách hình khoảng 20–40 cm.'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {!isActive && !hasFallback && (
          <section className="ar-intro" aria-labelledby="ar-page-title">
            <div className="ar-intro__visual" aria-hidden="true">
              <span className="ar-intro__orbit" />
              <Camera size={52} strokeWidth={1.6} />
              <span className="ar-intro__spark ar-intro__spark--one">✦</span>
              <span className="ar-intro__spark ar-intro__spark--two">✦</span>
            </div>
            <p className="ar-eyebrow">TRẢI NGHIỆM DI SẢN SỐ</p>
            <h1 id="ar-page-title">Chạm vào di sản,<br />đánh thức câu chuyện</h1>
            <p className="ar-intro__lead">
              Đưa camera vào một trong 7 thẻ địa danh đã sẵn sàng để bắt đầu hành trình khám phá.
            </p>

            <ul className="ar-intro__promises" aria-label="Cam kết quyền riêng tư">
              <li><ShieldCheck size={18} aria-hidden="true" /> Hình ảnh chỉ được xử lý trên thiết bị</li>
              <li><LockKeyhole size={18} aria-hidden="true" /> Không ghi hình hoặc tải video lên máy chủ</li>
              <li><Check size={18} aria-hidden="true" /> Không cần đăng nhập</li>
            </ul>

            <button
              className="ar-button ar-button--primary ar-intro__start"
              type="button"
              onClick={startAR}
              disabled={isRequesting}
            >
              <Camera size={20} aria-hidden="true" />
              {isRequesting ? statusCopy.loading : 'Bắt đầu quét AR'}
            </button>
            <p className="ar-intro__consent">
              Trình duyệt sẽ hỏi quyền camera sau khi bạn chọn bắt đầu.
            </p>
            <button className="ar-intro__browse" type="button" onClick={openCatalog}>
              <BookOpen size={17} aria-hidden="true" /> Xem 7 địa danh đã có
            </button>
          </section>
        )}

        {hasFallback && <CameraFallback status={status} error={error} onBrowse={openCatalog} onRetry={startAR} />}
      </section>
      {catalogOpen && (
        <HeritageCatalog
          experiences={experiences}
          selectedExperience={selectedExperience}
          onClose={closeCatalog}
          onSelect={setSelectedExperience}
        />
      )}
    </main>
  )
}

export default ArExperiencePage
