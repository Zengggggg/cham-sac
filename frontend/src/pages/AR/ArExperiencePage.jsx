import { useCallback, useState } from 'react'
import {
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
import HeritageModelDialog from '../../components/ar/HeritageModelDialog.jsx'
import brandMark from '../../assets/elements/wtm_withstroke.png'
import useMindARSession from '../../hooks/useMindARSession.js'
import useArExperiences from '../../hooks/useArExperiences.js'
import './ArExperiencePage.scss'

const statusCopy = {
  loading: 'Đang tải bộ nhận diện MindAR…',
  scanning: 'Căn thẻ địa danh để nhận diện',
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

function HeritageCatalog({ open, experiences, selectedExperience, onClose, onPreview, onSelect }) {
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
                {selectedExperience.model?.url && (
                  <Button
                    className="ar-place-detail__preview"
                    onClick={() => onPreview(selectedExperience)}
                    icon={<Sparkles size={18} aria-hidden="true" />}
                  >
                    Xem mô hình 3D
                  </Button>
                )}
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
    <main className={`ar-page${isCameraActive ? ' ar-page--active' : ''}`}>
      {isCameraActive && (
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
        <div className="ar-stage__mindar" ref={containerRef} aria-label="Hình ảnh camera dùng để nhận diện thẻ địa danh" />

        {isCameraActive && (
          <>
            <div className="ar-scanner">
              <div className="ar-scanner__status" role="status" aria-live="polite">
                <span className="ar-scanner__dot" aria-hidden="true" />
                {recognizedExperience ? `Đã nhận diện: ${recognizedExperience.name}` : statusCopy[status]}
              </div>
              <div className={`ar-scanner__frame${recognizedExperience ? ' ar-scanner__frame--recognized' : ''}`}>
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
                  ? <Sparkles size={22} aria-hidden="true" />
                  : <ScanLine size={22} aria-hidden="true" />}
                <div className="ar-scanner__guide-copy">
                  <strong>
                    {recognizedExperience
                      ? 'Đang mở mô hình di sản'
                      : status === 'loading'
                        ? 'Đang chuẩn bị bộ nhận diện'
                        : 'Đưa hình địa danh vào giữa khung'}
                  </strong>
                  <span>
                    {recognizedExperience
                      ? 'Camera sẽ tự tắt; mô hình 3D mở trong một cửa sổ riêng để bạn xoay và thu phóng.'
                      : status === 'loading'
                        ? 'Lần khởi động đầu tiên có thể mất vài giây.'
                        : 'Giữ điện thoại ổn định, đủ sáng và cách hình khoảng 20–40 cm.'}
                  </span>
                </div>
              </div>
            </Card>
          </>
        )}

        {!isCameraActive && !hasFallback && !viewerExperience && (
          <section className="ar-intro" aria-labelledby="ar-page-title">
            <div className="ar-intro__copy">
              <p className="ar-eyebrow"><Sparkles size={17} aria-hidden="true" /> TRẢI NGHIỆM DI SẢN SỐ</p>
              <h1 id="ar-page-title">Chạm vào di sản,<span>đánh thức câu chuyện</span></h1>
              <p className="ar-intro__lead">
                Căn một trong 7 thẻ địa danh vào khung. Khi nhận diện thành công, camera tự tắt và mô hình 3D mở để bạn tự do khám phá.
              </p>
              <div className="ar-intro__actions">
                <Button
                  className="ar-intro__start"
                  size="lg"
                  onClick={startAR}
                  disabled={isRequesting}
                  icon={<Camera size={20} aria-hidden="true" />}
                >
                  {isRequesting ? statusCopy.loading : 'Mở camera quét thẻ'}
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
              description="Camera chỉ dùng để nhận diện thẻ và tự tắt trước khi mô hình 3D xuất hiện."
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
                <li><span>03</span> Xoay và xem mô hình</li>
              </ol>
            </Card>
          </section>
        )}

        {hasFallback && <CameraFallback status={status} error={error} onBrowse={openCatalog} onRetry={startAR} />}
      </section>

      {viewerExperience && (
        <HeritageModelDialog
          experience={viewerExperience}
          onClose={closeResult}
          onScanAgain={scanAgain}
        />
      )}

      <HeritageCatalog
        open={catalogOpen}
        experiences={experiences}
        selectedExperience={selectedExperience}
        onClose={closeCatalog}
        onPreview={previewModel}
        onSelect={setSelectedExperience}
      />
    </main>
  )
}

export default ArExperiencePage
