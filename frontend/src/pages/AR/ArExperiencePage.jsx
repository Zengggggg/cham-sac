import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Camera, CameraOff, Check, ChevronLeft, ChevronRight, Landmark, LockKeyhole, MapPin, ScanLine, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeritageModelDialog from '../../components/ar/HeritageModelDialog.jsx'
import useMindARSession from '../../hooks/useMindARSession.js'
import useArExperiences from '../../hooks/useArExperiences.js'
import './ArExperiencePage.scss'

const statusCopy = {
  loading: 'Đang chuẩn bị bộ nhận diện…',
  scanning: 'Đang tìm thẻ địa danh',
  recognized: 'Đã nhận diện · Đang tắt camera',
}

function CameraFallback({ status, error, experienceCount, onBrowse, onRetry }) {
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
          <button className="ar-button ar-button--primary" type="button" onClick={onRetry}>Thử lại</button>
        )}
        <button className="ar-button ar-button--secondary" type="button" onClick={onBrowse}>
          <BookOpen size={18} aria-hidden="true" /> Xem {experienceCount} địa danh
        </button>
      </div>
    </section>
  )
}

function HeritageCatalog({ experiences, selectedExperience, onClose, onPreview, onSelect }) {
  return (
    <section className="ar-catalog" role="dialog" aria-modal="true" aria-labelledby="ar-catalog-title">
      <div className="ar-catalog__panel">
        <header className="ar-catalog__header">
          <div>
            <p>{selectedExperience ? selectedExperience.location : 'Bộ thẻ đang hỗ trợ'}</p>
            <h2 id="ar-catalog-title">{selectedExperience ? selectedExperience.name : `${experiences.length} địa danh để khám phá`}</h2>
          </div>
          <button className="ar-icon-button" type="button" onClick={onClose} aria-label="Đóng danh sách địa danh">
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
                {selectedExperience.model?.url && (
                  <button className="ar-button ar-button--primary ar-place-detail__preview" type="button" onClick={() => onPreview(selectedExperience)}>
                    <Landmark size={18} aria-hidden="true" /> Xem mô hình 3D
                  </button>
                )}
              </div>
            </div>
          </article>
        ) : (
          <>
            <p className="ar-catalog__intro">Chọn một thẻ để đọc nội dung văn hóa, kể cả khi camera không khả dụng.</p>
            <div className="ar-catalog__grid">
              {experiences.map((experience) => (
                <button className="ar-place-card" type="button" key={experience.id} onClick={() => onSelect(experience)}>
                  <img src={experience.targetImage} alt="" />
                  <span className="ar-place-card__body">
                    <small><MapPin size={13} aria-hidden="true" /> {experience.location}</small>
                    <strong>{experience.name}</strong>
                    <span>{experience.tagline}</span>
                  </span>
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function ArExperiencePage() {
  const { experiences } = useArExperiences()
  const { containerRef, error, recognizedExperience, startAR, status, stopAR } = useMindARSession(experiences)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [selectedExperience, setSelectedExperience] = useState(null)
  const [previewExperience, setPreviewExperience] = useState(null)
  const isCameraActive = ['loading', 'scanning', 'recognized'].includes(status)
  const isRequesting = status === 'loading'
  const hasFallback = ['error', 'insecure', 'unsupported'].includes(status)
  const isViewing = status === 'viewing' && recognizedExperience
  const viewerExperience = isViewing ? recognizedExperience : previewExperience

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
  const previewModel = useCallback((experience) => {
    setCatalogOpen(false)
    setSelectedExperience(null)
    setPreviewExperience(experience)
  }, [])
  const closeResult = useCallback(() => {
    setPreviewExperience(null)
    if (isViewing) stopAR()
  }, [isViewing, stopAR])
  const scanAgain = useCallback(() => {
    setPreviewExperience(null)
    startAR()
  }, [startAR])

  return (
    <main className={`ar-page${isCameraActive ? ' ar-page--scanning' : ''}`}>
      <header className="ar-toolbar">
        <Link className="ar-toolbar__back" to="/" aria-label="Trở về trang chủ">
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Trang chủ</span>
        </Link>
        <div className="ar-toolbar__brand" aria-label="Chạm Sắc Việt">
          <Landmark size={20} aria-hidden="true" />
          <span>CHẠM SẮC VIỆT</span>
        </div>
        {isCameraActive ? (
          <button className="ar-toolbar__stop" type="button" onClick={stopAR}>
            <CameraOff size={18} aria-hidden="true" /> Dừng camera
          </button>
        ) : <span className="ar-toolbar__spacer" />}
      </header>

      <section className="ar-stage" aria-label="Khu vực trải nghiệm thực tế tăng cường">
        <div className="ar-stage__mindar" ref={containerRef} aria-label="Hình ảnh camera dùng để nhận diện thẻ địa danh" />

        {isCameraActive && (
          <div className="ar-scanner">
            <div className="ar-scanner__status" role="status" aria-live="polite">
              <span className="ar-scanner__dot" aria-hidden="true" />
              {recognizedExperience ? `Đã nhận diện ${recognizedExperience.name}` : statusCopy[status]}
            </div>
            <div className={`ar-scanner__frame${recognizedExperience ? ' ar-scanner__frame--recognized' : ''}`} aria-hidden="true">
              <span className="ar-scanner__corner ar-scanner__corner--tl" />
              <span className="ar-scanner__corner ar-scanner__corner--tr" />
              <span className="ar-scanner__corner ar-scanner__corner--bl" />
              <span className="ar-scanner__corner ar-scanner__corner--br" />
              <span className="ar-scanner__line" />
            </div>
            <div className="ar-scanner__guide">
              {recognizedExperience ? <Check size={22} aria-hidden="true" /> : <ScanLine size={22} aria-hidden="true" />}
              <div>
                <strong>{recognizedExperience ? 'Đang mở không gian khám phá' : 'Đưa toàn bộ thẻ vào khung'}</strong>
                <span>{recognizedExperience ? 'Camera sẽ tắt ngay; mô hình 3D không dùng ảnh chụp làm nền.' : 'Giữ máy ổn định, đủ sáng và cách thẻ khoảng 20–40 cm.'}</span>
              </div>
            </div>
          </div>
        )}

        {!isCameraActive && !hasFallback && !isViewing && (
          <section className="ar-intro" aria-labelledby="ar-page-title">
            <div className="ar-intro__copy">
              <span className="ar-intro__signal"><span aria-hidden="true" /> Nhận diện ngay trên thiết bị</span>
              <h1 id="ar-page-title">Quét thẻ. Xoay cả di sản.</h1>
              <p className="ar-intro__lead">
                Camera chỉ dùng để tìm đúng thẻ. Nhận diện xong, camera tự tắt và mô hình 3D mở trong một thẻ khám phá riêng để bạn xoay, phóng to và đọc câu chuyện địa danh.
              </p>
              <div className="ar-intro__actions">
                <button className="ar-button ar-button--primary" type="button" onClick={startAR} disabled={isRequesting}>
                  <Camera size={20} aria-hidden="true" />
                  {isRequesting ? statusCopy.loading : 'Mở camera quét thẻ'}
                </button>
                <button className="ar-button ar-button--secondary" type="button" onClick={openCatalog}>
                  <BookOpen size={18} aria-hidden="true" /> Xem {experiences.length} địa danh
                </button>
              </div>
              <ul className="ar-intro__privacy" aria-label="Cam kết quyền riêng tư">
                <li><ShieldCheck size={18} aria-hidden="true" /> Nhận diện trên thiết bị</li>
                <li><LockKeyhole size={18} aria-hidden="true" /> Không lưu ảnh hay video</li>
                <li><Check size={18} aria-hidden="true" /> Không cần đăng nhập</li>
              </ul>
            </div>

            <aside className="ar-intro__workbench" aria-label="Ba bước trải nghiệm AR">
              <div className="ar-intro__workbench-head">
                <span>Quy trình</span>
                <strong>Camera dừng sau bước 2</strong>
              </div>
              <ol className="ar-intro__steps">
                <li><span>1</span><div><strong>Mở camera</strong><small>Căn thẻ địa danh vào khung.</small></div></li>
                <li><span>2</span><div><strong>Nhận diện thẻ</strong><small>MindAR đối chiếu trên thiết bị.</small></div></li>
                <li><span>3</span><div><strong>Khám phá mô hình</strong><small>Xoay mọi hướng, thu phóng và đọc thông tin.</small></div></li>
              </ol>
              <div className="ar-intro__targets" aria-label="Một số thẻ đang hỗ trợ">
                {experiences.slice(0, 4).map((experience) => (
                  <img key={experience.id} src={experience.targetImage} alt={`Thẻ ${experience.name}`} />
                ))}
              </div>
            </aside>
          </section>
        )}

        {hasFallback && (
          <CameraFallback
            status={status}
            error={error}
            experienceCount={experiences.length}
            onBrowse={openCatalog}
            onRetry={startAR}
          />
        )}
      </section>

      {viewerExperience && (
        <HeritageModelDialog
          experience={viewerExperience}
          onClose={closeResult}
          onScanAgain={scanAgain}
        />
      )}

      {catalogOpen && (
        <HeritageCatalog
          experiences={experiences}
          selectedExperience={selectedExperience}
          onClose={closeCatalog}
          onPreview={previewModel}
          onSelect={setSelectedExperience}
        />
      )}
    </main>
  )
}

export default ArExperiencePage
