import { useState } from 'react'
import {
  Aperture,
  ArrowLeft,
  BookOpen,
  Camera,
  CameraOff,
  ChevronLeft,
  ChevronRight,
  House,
  MapPin,
  RefreshCw,
  ScanLine,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import Modal from '../../components/ui/Modal.jsx'
import brandMark from '../../assets/elements/wtm_withstroke.png'
import useMindARSession from '../../hooks/useMindARSession.js'
import useArExperiences from '../../hooks/useArExperiences.js'
import './ArExperiencePage.scss'

const statusCopy = {
  loading: 'Đang tải bộ nhận diện MindAR…',
  scanning: 'Căn thẻ địa danh để chụp',
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
          <Button onClick={onRetry} icon={<RefreshCw size={18} aria-hidden="true" />}>
            Thử lại
          </Button>
        )}
        <Button as={Link} variant="secondary" to="/about-us" icon={<ArrowLeft size={18} aria-hidden="true" />}>
          Khám phá Chạm Sắc Việt
        </Button>
        <Button variant="ghost" onClick={onBrowse} icon={<BookOpen size={18} aria-hidden="true" />}>
          Xem 7 địa danh
        </Button>
      </div>
    </section>
  )
}

function HeritageCatalog({ open, experiences, selectedExperience, onClose, onSelect }) {
  const title = selectedExperience ? selectedExperience.name : 'Khám phá 7 địa danh'
  const description = selectedExperience
    ? selectedExperience.tagline
    : 'Xem trước nội dung văn hóa ngay cả khi camera chưa sẵn sàng.'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      headerLeading={selectedExperience ? (
        <Button
          className="ar-catalog__back"
          variant="ghost"
          size="sm"
          onClick={() => onSelect(null)}
          aria-label="Quay lại danh sách tất cả địa danh"
          icon={<ChevronLeft size={18} aria-hidden="true" />}
        >
          Tất cả địa danh
        </Button>
      ) : null}
    >
      <section className="ar-catalog" aria-label="Bộ thẻ địa danh đang hỗ trợ">
        {selectedExperience ? (
          <article className="ar-place-detail">
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
        )}
      </section>
    </Modal>
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
    return <p className="ar-model-status ar-model-status--ready">Mô hình 3D đã hiện trên ảnh chụp.</p>
  }

  if (modelState.status === 'error') {
    return (
      <div className="ar-model-status ar-model-status--error" role="alert">
        <span>{modelState.message}</span>
        <Button size="sm" variant="secondary" onClick={onRetry}>Tải lại model</Button>
      </div>
    )
  }

  return <p className="ar-model-status ar-model-status--muted">{modelState.message}</p>
}

function CaptureBuildAnimation({ captureState, experience, progress }) {
  if (!['loading', 'revealing'].includes(captureState.status)) return null

  const progressLabel = Number.isFinite(progress) ? `${progress}%` : 'Đang tải'
  return (
    <div className={`ar-capture-build ar-capture-build--${captureState.status}`} role="status" aria-live="polite">
      <span className="ar-capture-build__halo" aria-hidden="true" />
      <span className="ar-capture-build__orbit" aria-hidden="true" />
      <span className="ar-capture-build__tower" aria-hidden="true">
        <span className="ar-capture-build__spire" />
        <span className="ar-capture-build__level ar-capture-build__level--top" />
        <span className="ar-capture-build__level ar-capture-build__level--middle" />
        <span className="ar-capture-build__level ar-capture-build__level--base" />
      </span>
      <span className="ar-capture-build__scan" aria-hidden="true" />
      <strong>{captureState.status === 'revealing' ? 'Đang mở lớp di sản' : `Đang dựng ${experience.name}`}</strong>
      <small>{captureState.status === 'revealing' ? 'Mô hình đã sẵn sàng' : progressLabel}</small>
    </div>
  )
}

function ArExperiencePage() {
  const { experiences } = useArExperiences()
  const {
    captureState,
    captureTarget,
    containerRef,
    error,
    modelState,
    recognizedExperience,
    retakeCapture,
    retryModel,
    startAR,
    status,
    stopAR,
  } = useMindARSession(experiences)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [selectedExperience, setSelectedExperience] = useState(null)
  const isActive = ['loading', 'scanning', 'recognized', 'captured'].includes(status)
  const isRequesting = status === 'loading'
  const hasFallback = ['error', 'insecure', 'unsupported'].includes(status)
  const hasCapture = captureState.status !== 'idle'

  const openCatalog = () => setCatalogOpen(true)
  const closeCatalog = () => {
    setCatalogOpen(false)
    setSelectedExperience(null)
  }

  return (
    <main className={`ar-page${isActive ? ' ar-page--active' : ''}`}>
      {isActive && (
        <header className="ar-toolbar">
          <Button
            as={Link}
            className="ar-toolbar__back"
            variant="ghost"
            size="sm"
            to="/"
            aria-label="Trở về trang chủ"
            icon={<House size={19} aria-hidden="true" />}
          >
            Trang chủ
          </Button>
          <Link className="ar-toolbar__brand" to="/" aria-label="Chạm Sắc Việt - Trang chủ">
            <img src={brandMark} alt="Chạm Sắc Việt" />
          </Link>
          <Button
            className="ar-toolbar__stop"
            variant="danger"
            size="sm"
            onClick={stopAR}
            aria-label="Dừng camera"
            icon={<CameraOff size={18} aria-hidden="true" />}
          >
            Dừng camera
          </Button>
        </header>
      )}

      <section className="ar-stage" aria-label="Khu vực trải nghiệm thực tế tăng cường">
        <div
          className={`ar-stage__mindar${hasCapture ? ' ar-stage__mindar--captured' : ''}`}
          ref={containerRef}
          style={captureState.imageUrl ? { backgroundImage: `url("${captureState.imageUrl}")` } : undefined}
          aria-label="Hình ảnh camera và lớp phủ thực tế tăng cường"
        />

        {isActive && (
          <>
          <div className="ar-scanner">
            <div className="ar-scanner__status" role="status" aria-live="polite">
              <span className="ar-scanner__dot" aria-hidden="true" />
              {hasCapture
                ? `Đã chụp: ${recognizedExperience?.name}`
                : recognizedExperience
                  ? `Đã nhận diện: ${recognizedExperience.name}`
                  : statusCopy[status]}
            </div>
            <div className={`ar-scanner__frame${recognizedExperience ? ' ar-scanner__frame--recognized' : ''}${hasCapture ? ' ar-scanner__frame--captured' : ''}`}>
              {recognizedExperience && (
                <CaptureBuildAnimation
                  captureState={captureState}
                  experience={recognizedExperience}
                  progress={modelState.progress}
                />
              )}
              <span className="ar-scanner__corner ar-scanner__corner--tl" />
              <span className="ar-scanner__corner ar-scanner__corner--tr" />
              <span className="ar-scanner__corner ar-scanner__corner--bl" />
              <span className="ar-scanner__corner ar-scanner__corner--br" />
              <span className="ar-scanner__line" />
            </div>
          </div>
            <Card className="ar-scanner__guide">
              <div className="ar-scanner__guide-layout">
                {recognizedExperience
                  ? hasCapture
                    ? <Sparkles size={22} aria-hidden="true" />
                    : <Aperture size={22} aria-hidden="true" />
                  : <ScanLine size={22} aria-hidden="true" />}
                <div className="ar-scanner__guide-copy">
                  <strong>
                    {recognizedExperience
                      ? hasCapture
                        ? recognizedExperience.name
                        : 'Thẻ đã sẵn sàng để chụp'
                      : status === 'loading'
                        ? 'Đang chuẩn bị bộ nhận diện'
                        : 'Đưa hình địa danh vào giữa khung'}
                  </strong>
                  <span>
                    {recognizedExperience
                      ? hasCapture
                        ? recognizedExperience.tagline
                        : 'Giữ máy ổn định rồi chạm nút chụp để dựng mô hình 3D.'
                      : status === 'loading'
                        ? 'Lần khởi động đầu tiên có thể mất vài giây.'
                        : 'Giữ điện thoại ổn định, đủ sáng và cách hình khoảng 20–40 cm.'}
                  </span>
                  {recognizedExperience && !hasCapture && (
                    <Button size="sm" onClick={captureTarget} icon={<Camera size={17} aria-hidden="true" />}>
                      Chụp thẻ & dựng mô hình
                    </Button>
                  )}
                  {recognizedExperience && hasCapture && <ModelLoadStatus modelState={modelState} onRetry={retryModel} />}
                  {recognizedExperience && ['ready', 'error'].includes(captureState.status) && (
                    <Button size="sm" variant="secondary" onClick={retakeCapture} icon={<RefreshCw size={15} aria-hidden="true" />}>
                      Chụp lại
                    </Button>
                  )}
                  {recognizedExperience && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedExperience(recognizedExperience)
                        setCatalogOpen(true)
                      }}
                      icon={<BookOpen size={16} aria-hidden="true" />}
                    >
                      Xem câu chuyện địa danh
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </>
        )}

        {!isActive && !hasFallback && (
          <section className="ar-intro" aria-labelledby="ar-page-title">
            <div className="ar-intro__copy">
              <p className="ar-eyebrow"><Sparkles size={17} aria-hidden="true" /> TRẢI NGHIỆM DI SẢN SỐ</p>
              <h1 id="ar-page-title">Chạm vào di sản,<span>đánh thức câu chuyện</span></h1>
              <p className="ar-intro__lead">
                Căn một trong 7 thẻ địa danh vào khung, chụp lại và chờ mô hình di sản được dựng ngay trên ảnh.
              </p>
              <div className="ar-intro__actions">
                <Button
                  className="ar-intro__start"
                  size="lg"
                  onClick={startAR}
                  disabled={isRequesting}
                  icon={<Camera size={20} aria-hidden="true" />}
                >
                  {isRequesting ? statusCopy.loading : 'Mở camera chụp AR'}
                </Button>
                <Button
                  className="ar-intro__browse"
                  size="lg"
                  variant="secondary"
                  onClick={openCatalog}
                  icon={<BookOpen size={18} aria-hidden="true" />}
                >
                  Xem 7 địa danh
                </Button>
              </div>
              <p className="ar-intro__consent">
                Trình duyệt chỉ hỏi quyền camera sau khi bạn chọn bắt đầu.
              </p>
            </div>

            <Card
              className="ar-intro__guide-card"
              eyebrow="3 BƯỚC KHÁM PHÁ"
              title="Đưa thẻ vào khung"
              description="Camera sẽ nhận diện hình địa danh, sau đó bạn chụp để dựng mô hình 3D."
            >
              <div className="ar-intro__preview" aria-hidden="true">
                <span className="ar-intro__preview-corner ar-intro__preview-corner--tl" />
                <span className="ar-intro__preview-corner ar-intro__preview-corner--tr" />
                <span className="ar-intro__preview-corner ar-intro__preview-corner--bl" />
                <span className="ar-intro__preview-corner ar-intro__preview-corner--br" />
                <Camera size={52} strokeWidth={1.7} />
              </div>
              <ol className="ar-intro__steps">
                <li><span>01</span> Cho phép camera</li>
                <li><span>02</span> Căn thẻ địa danh</li>
                <li><span>03</span> Chụp và xem mô hình</li>
              </ol>
            </Card>
          </section>
        )}

        {hasFallback && <CameraFallback status={status} error={error} onBrowse={openCatalog} onRetry={startAR} />}
      </section>

      <HeritageCatalog
        open={catalogOpen}
        experiences={experiences}
        selectedExperience={selectedExperience}
        onClose={closeCatalog}
        onSelect={setSelectedExperience}
      />
    </main>
  )
}

export default ArExperiencePage
