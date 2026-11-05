import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Box,
  CircleHelp,
  Camera,
  CameraOff,
  ChevronLeft,
  ChevronRight,
  House,
  MapPin,
  RefreshCw,
  ScanLine,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import brandMark from "../../assets/elements/wtm_withstroke.png";
import { listPublicQuestionGroups } from "../../services/questionService.js";
import useMindARSession from "../../hooks/useMindARSession.js";
import useArExperiences from "../../hooks/useArExperiences.js";
import HeritageModelViewer from "./HeritageModelViewer.jsx";
import "./ArExperiencePage.scss";

const normalizePlaceName = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi")
    .replace(/[–—]/g, "-")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const findQuestionGroup = (groups, experience) => {
  const matchingId = groups.find(
    (group) =>
      experience.backendId &&
      String(group.heritageSiteId) === String(experience.backendId),
  );
  if (matchingId) return matchingId;

  const experienceName = normalizePlaceName(experience.name);
  return (
    groups.find((group) => {
      const groupName = normalizePlaceName(group.name);
      return (
        groupName === experienceName ||
        groupName.startsWith(`${experienceName} `) ||
        experienceName.startsWith(`${groupName} `)
      );
    }) || null
  );
};

const statusCopy = {
  loading: "Đang tải bộ nhận diện MindAR…",
  scanning: "Căn thẻ địa danh để nhận diện",
};

function CameraFallback({ status, error, experienceCount, onBrowse, onRetry }) {
  const isInsecure = status === "insecure";
  const isUnsupported = status === "unsupported";
  const title = isInsecure
    ? "Cần kết nối an toàn"
    : isUnsupported
      ? "Thiết bị chưa hỗ trợ camera web"
      : "Chưa thể mở camera";
  const description = isInsecure
    ? "Hãy mở trang bằng HTTPS để trình duyệt cho phép sử dụng camera."
    : isUnsupported
      ? "Bạn có thể thử lại bằng Safari, Chrome hoặc Edge phiên bản mới nhất trên điện thoại."
      : error?.message;

  return (
    <section
      className="ar-fallback"
      role="alert"
      aria-labelledby="ar-fallback-title"
    >
      <span className="ar-fallback__icon" aria-hidden="true">
        <CameraOff size={28} />
      </span>
      <p className="ar-eyebrow">PHƯƠNG ÁN THAY THẾ</p>
      <h1 id="ar-fallback-title">{title}</h1>
      <p>{description}</p>
      {error?.code === "permission-denied" && (
        <ol className="ar-fallback__steps">
          <li>Chạm biểu tượng ổ khóa cạnh thanh địa chỉ.</li>
          <li>Đổi quyền Camera thành “Cho phép”.</li>
          <li>Quay lại trang và chọn “Thử lại”.</li>
        </ol>
      )}
      <div className="ar-fallback__actions">
        {!isInsecure && !isUnsupported && (
          <Button
            onClick={onRetry}
            icon={<RefreshCw size={18} aria-hidden="true" />}
          >
            Thử lại
          </Button>
        )}
        <Button
          as={Link}
          variant="secondary"
          to="/about-us"
          icon={<ArrowLeft size={18} aria-hidden="true" />}
        >
          Khám phá Chạm Sắc Việt
        </Button>
        <Button
          variant="ghost"
          onClick={onBrowse}
          icon={<BookOpen size={18} aria-hidden="true" />}
        >
          Xem {experienceCount} địa danh
        </Button>
      </div>
    </section>
  );
}

function HeritageCatalog({
  open,
  experiences,
  modelPreviewOpen,
  selectedExperience,
  onClose,
  onSelect,
  onToggleModelPreview,
}) {
  const title = selectedExperience
    ? selectedExperience.name
    : `Khám phá ${experiences.length} địa danh`;
  const description = selectedExperience
    ? selectedExperience.tagline
    : "Xem trước nội dung văn hóa ngay cả khi camera chưa sẵn sàng.";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      headerLeading={
        selectedExperience ? (
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
        ) : null
      }
    >
      <section className="ar-catalog" aria-label="Bộ thẻ địa danh đang hỗ trợ">
        {selectedExperience ? (
          <article className="ar-place-detail">
            <div className="ar-place-detail__layout">
              {modelPreviewOpen ? (
                <HeritageModelViewer
                  key={selectedExperience.id}
                  model={selectedExperience.model}
                  name={selectedExperience.name}
                />
              ) : (
                <img
                  src={selectedExperience.targetImage}
                  alt={`Thẻ địa danh ${selectedExperience.name}`}
                />
              )}
              <div className="ar-place-detail__content">
                <span className="ar-place-detail__location">
                  <MapPin size={16} aria-hidden="true" />{" "}
                  {selectedExperience.location}
                </span>
                <p className="ar-place-detail__tagline">
                  {selectedExperience.tagline}
                </p>
                <p className="ar-place-detail__summary">
                  {selectedExperience.shortDescription}
                </p>
                {selectedExperience.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {selectedExperience.model?.url && (
                  <Button
                    className="ar-place-detail__preview"
                    onClick={onToggleModelPreview}
                    variant={modelPreviewOpen ? "secondary" : "primary"}
                    icon={<Box size={18} aria-hidden="true" />}
                  >
                    {modelPreviewOpen ? "Ẩn mô hình 3D" : "Xem mô hình 3D"}
                  </Button>
                )}
              </div>
            </div>
          </article>
        ) : (
          <div className="ar-catalog__grid">
            {experiences.map((experience) => (
              <button
                className="ar-place-card"
                type="button"
                key={experience.id}
                onClick={() => onSelect(experience)}
              >
                <img src={experience.targetImage} alt="" />
                <span className="ar-place-card__body">
                  <small>
                    <MapPin size={13} aria-hidden="true" />{" "}
                    {experience.location}
                  </small>
                  <strong>{experience.name}</strong>
                  <span>{experience.tagline}</span>
                </span>
                <ChevronRight
                  className="ar-place-card__arrow"
                  size={20}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}
      </section>
    </Modal>
  );
}

function ArExperiencePage() {
  const { experiences } = useArExperiences();
  const {
    containerRef,
    error,
    narrationState,
    pauseAR,
    recognizedExperience,
    resumeAR,
    startAR,
    status,
    stopAR,
    toggleNarration,
  } = useMindARSession(experiences);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [modelPreviewOpen, setModelPreviewOpen] = useState(false);
  const [detailExperience, setDetailExperience] = useState(null);
  const [questionState, setQuestionState] = useState({
    status: "idle",
    group: null,
    error: "",
  });
  const [questionRetry, setQuestionRetry] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const isCameraActive = ["loading", "scanning", "recognized"].includes(status);
  const isRequesting = status === "loading";
  const hasFallback = ["error", "insecure", "unsupported"].includes(status);

  useEffect(() => {
    if (!detailExperience) return undefined;

    let isCurrentRequest = true;
    listPublicQuestionGroups()
      .then((response) => {
        if (!isCurrentRequest) return;
        if (!Array.isArray(response?.data)) {
          throw new Error("Dữ liệu câu hỏi không đúng định dạng.");
        }
        setQuestionState({
          status: "ready",
          group: findQuestionGroup(response.data, detailExperience),
          error: "",
        });
      })
      .catch((requestError) => {
        if (!isCurrentRequest) return;
        setQuestionState({
          status: "error",
          group: null,
          error:
            requestError.message || "Không thể tải câu hỏi cho địa danh này.",
        });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [detailExperience, questionRetry]);

  const openCatalog = () => {
    setModelPreviewOpen(false);
    setCatalogOpen(true);
  };
  const openRecognizedDetail = () => {
    if (!recognizedExperience) return;
    pauseAR();
    setDetailExperience(recognizedExperience);
    setRevealedAnswers({});
    setSelectedAnswers({});
    setQuestionState({ status: "loading", group: null, error: "" });
  };
  const closeRecognizedDetail = () => {
    setDetailExperience(null);
    resumeAR();
  };
  const closeCatalog = () => {
    setCatalogOpen(false);
    setSelectedExperience(null);
    setModelPreviewOpen(false);
  };
  const selectCatalogExperience = (experience) => {
    setSelectedExperience(experience);
    setModelPreviewOpen(false);
  };

  return (
    <main className={`ar-page${isCameraActive ? " ar-page--active" : ""}`}>
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
          <Link
            className="ar-toolbar__brand"
            to="/"
            aria-label="Chạm Sắc Việt - Trang chủ"
          >
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

      <section
        className="ar-stage"
        aria-label="Khu vực trải nghiệm thực tế tăng cường"
      >
        <div
          className="ar-stage__mindar"
          ref={containerRef}
          aria-label="Hình ảnh camera dùng để nhận diện thẻ địa danh"
        />

        {isCameraActive && (
          <>
            <div className="ar-scanner">
              <div
                className="ar-scanner__status"
                role="status"
                aria-live="polite"
              >
                <span className="ar-scanner__dot" aria-hidden="true" />
                {recognizedExperience
                  ? `Đã nhận diện: ${recognizedExperience.name}`
                  : statusCopy[status]}
              </div>
              <div
                className={`ar-scanner__frame${recognizedExperience ? " ar-scanner__frame--recognized" : ""}`}
              >
                <span className="ar-scanner__corner ar-scanner__corner--tl" />
                <span className="ar-scanner__corner ar-scanner__corner--tr" />
                <span className="ar-scanner__corner ar-scanner__corner--bl" />
                <span className="ar-scanner__corner ar-scanner__corner--br" />
                <span className="ar-scanner__line" />
              </div>
            </div>
            <Card className="ar-scanner__guide">
              <div className="ar-scanner__guide-layout">
                {recognizedExperience ? (
                  <Sparkles size={22} aria-hidden="true" />
                ) : (
                  <ScanLine size={22} aria-hidden="true" />
                )}
                <div className="ar-scanner__guide-copy">
                  <strong>
                    {recognizedExperience
                      ? `Đã nhận diện ${recognizedExperience.name}`
                      : status === "loading"
                        ? "Đang chuẩn bị bộ nhận diện"
                        : "Đưa hình địa danh vào giữa khung"}
                  </strong>
                  <span>
                    {recognizedExperience
                      ? "Mô hình 3D đang hiển thị trên thẻ. Mở thẻ khám phá để xem chi tiết và xoay mô hình."
                      : status === "loading"
                        ? "Lần khởi động đầu tiên có thể mất vài giây."
                        : "Giữ điện thoại ổn định, đủ sáng và cách hình khoảng 20–40 cm."}
                  </span>
                  {recognizedExperience?.audioUrl && narrationState.message && (
                    <span
                      className={`ar-narration-status ar-narration-status--${narrationState.status}`}
                      role="status"
                      aria-live="polite"
                    >
                      {narrationState.message}
                    </span>
                  )}
                  {recognizedExperience && (
                    <Button
                      className="ar-scanner__detail-button"
                      onClick={openRecognizedDetail}
                      icon={<Box size={18} aria-hidden="true" />}
                    >
                      {recognizedExperience.model?.url
                        ? "Hiện mô hình 3D"
                        : "Xem thông tin địa danh"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </>
        )}

        {recognizedExperience?.audioUrl && (
          <div
            className="ar-model-info-actions"
            aria-label="Điều khiển thuyết minh địa danh"
          >
            <button
              className={`ar-model-info-actions__button${narrationState.status === "playing" ? " ar-model-info-actions__button--audio-active" : ""}`}
              type="button"
              onClick={toggleNarration}
              aria-label={
                narrationState.status === "playing"
                  ? `Tạm dừng thuyết minh về ${recognizedExperience.name}`
                  : `Phát thuyết minh về ${recognizedExperience.name}`
              }
              aria-pressed={narrationState.status === "playing"}
              title={
                narrationState.status === "playing"
                  ? "Tạm dừng thuyết minh"
                  : "Phát thuyết minh"
              }
            >
              {narrationState.status === "playing" ? (
                <Volume2 size={22} aria-hidden="true" />
              ) : (
                <VolumeX size={22} aria-hidden="true" />
              )}
            </button>
          </div>
        )}

        {!isCameraActive && !hasFallback && (
          <section className="ar-intro" aria-labelledby="ar-page-title">
            <div className="ar-intro__copy">
              <p className="ar-eyebrow">
                <Sparkles size={17} aria-hidden="true" /> TRẢI NGHIỆM DI SẢN SỐ
              </p>
              <h1 id="ar-page-title">
                Chạm vào di sản,<span>đánh thức câu chuyện</span>
              </h1>
              <p className="ar-intro__lead">
                Căn một trong {experiences.length} thẻ địa danh vào khung. Khi
                nhận diện thành công, mở thẻ khám phá để xem mô hình 3D và
                thông tin địa danh.
              </p>
              <div className="ar-intro__actions">
                <Button
                  className="ar-intro__start"
                  size="lg"
                  onClick={startAR}
                  disabled={isRequesting}
                  icon={<Camera size={20} aria-hidden="true" />}
                >
                  {isRequesting ? statusCopy.loading : "Mở camera quét thẻ"}
                </Button>
                <Button
                  className="ar-intro__browse"
                  size="lg"
                  variant="secondary"
                  onClick={openCatalog}
                  icon={<BookOpen size={18} aria-hidden="true" />}
                >
                  Xem {experiences.length} địa danh
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
              description="Camera nhận diện địa danh, sau đó mở một thẻ khám phá có mô hình 3D tương tác, thông tin và câu hỏi."
            >
              <div className="ar-intro__preview" aria-hidden="true">
                <span className="ar-intro__preview-corner ar-intro__preview-corner--tl" />
                <span className="ar-intro__preview-corner ar-intro__preview-corner--tr" />
                <span className="ar-intro__preview-corner ar-intro__preview-corner--bl" />
                <span className="ar-intro__preview-corner ar-intro__preview-corner--br" />
                <Camera size={52} strokeWidth={1.7} />
              </div>
              <ol className="ar-intro__steps">
                <li>
                  <span>01</span> Cho phép camera
                </li>
                <li>
                  <span>02</span> Căn thẻ địa danh
                </li>
                <li>
                  <span>03</span> Mở thẻ khám phá 3D
                </li>
              </ol>
            </Card>
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

      <HeritageCatalog
        open={catalogOpen}
        experiences={experiences}
        modelPreviewOpen={modelPreviewOpen}
        selectedExperience={selectedExperience}
        onClose={closeCatalog}
        onSelect={selectCatalogExperience}
        onToggleModelPreview={() => setModelPreviewOpen((current) => !current)}
      />

      <Modal
        open={Boolean(detailExperience)}
        onClose={closeRecognizedDetail}
        title={detailExperience?.name || "Khám phá địa danh"}
        description={[detailExperience?.location, detailExperience?.tagline]
          .filter(Boolean)
          .join(" · ")}
        size="lg"
        className="ar-experience-modal"
      >
        {detailExperience && (
          <article className="ar-experience-card">
            <div className="ar-experience-card__viewer">
              {detailExperience.model?.url ? (
                <HeritageModelViewer
                  key={detailExperience.id}
                  model={detailExperience.model}
                  name={detailExperience.name}
                />
              ) : (
                <div className="ar-experience-card__model-unavailable">
                  <img
                    src={detailExperience.targetImage}
                    alt={`Thẻ địa danh ${detailExperience.name}`}
                  />
                  <p>Địa danh này chưa có mô hình 3D.</p>
                </div>
              )}
            </div>

            <div className="ar-experience-card__content">
              <section
                className="ar-info-place"
                aria-labelledby="ar-experience-about-title"
              >
                <div className="ar-experience-card__section-heading">
                  <div>
                    <span className="ar-place-detail__location">
                      <MapPin size={16} aria-hidden="true" />
                      {detailExperience.location}
                    </span>
                    <h3 id="ar-experience-about-title">Thông tin địa danh</h3>
                  </div>
                  {detailExperience.audioUrl && (
                    <Button
                      className="ar-info-place__audio"
                      type="button"
                      variant="secondary"
                      onClick={toggleNarration}
                      aria-pressed={narrationState.status === "playing"}
                      icon={
                        narrationState.status === "playing" ? (
                          <Volume2 size={19} aria-hidden="true" />
                        ) : (
                          <VolumeX size={19} aria-hidden="true" />
                        )
                      }
                    >
                      {narrationState.status === "playing"
                        ? "Tạm dừng"
                        : "Nghe thuyết minh"}
                    </Button>
                  )}
                </div>
                <p className="ar-info-place__summary">
                  {detailExperience.shortDescription}
                </p>
                {detailExperience.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>

              <section
                className="ar-info-questions"
                aria-labelledby="ar-experience-questions-title"
              >
                <div className="ar-experience-card__section-heading ar-experience-card__section-heading--questions">
                  <CircleHelp size={23} aria-hidden="true" />
                  <div>
                    <h3 id="ar-experience-questions-title">Thử tài hiểu biết</h3>
                    <p>Câu hỏi về {detailExperience.name}</p>
                  </div>
                </div>

                {questionState.status === "loading" ? (
                  <p className="ar-info-questions__state" role="status">
                    Đang tải câu hỏi...
                  </p>
                ) : questionState.status === "error" ? (
                  <div className="ar-info-questions__state" role="alert">
                    <p>{questionState.error}</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setQuestionState({
                          status: "loading",
                          group: null,
                          error: "",
                        });
                        setQuestionRetry((retry) => retry + 1);
                      }}
                    >
                      Thử tải lại
                    </Button>
                  </div>
                ) : !questionState.group?.questions?.length ? (
                  <p className="ar-info-questions__state">
                    Chưa có câu hỏi public cho địa danh này.
                  </p>
                ) : (
                  <ol className="ar-info-questions__list">
                    {questionState.group.questions.map((question) => {
                      const isRevealed = Boolean(revealedAnswers[question.id]);
                      const selectedOptionIndex = selectedAnswers[question.id];
                      const isAnswered = Number.isInteger(selectedOptionIndex);
                      const isCorrect =
                        selectedOptionIndex === question.correctOptionIndex;
                      return (
                        <li key={question.id}>
                          <p>{question.content}</p>
                          {question.options?.length > 0 && (
                            <>
                              <ul className="ar-info-questions__options">
                                {question.options.map((option, optionIndex) => (
                                  <li
                                    className={[
                                      (isRevealed || isAnswered) &&
                                      optionIndex === question.correctOptionIndex
                                        ? "is-correct"
                                        : "",
                                      isAnswered &&
                                      optionIndex === selectedOptionIndex &&
                                      !isCorrect
                                        ? "is-incorrect"
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                    key={`${question.id}-${optionIndex}`}
                                  >
                                    <button
                                      type="button"
                                      disabled={isAnswered}
                                      aria-pressed={
                                        selectedOptionIndex === optionIndex
                                      }
                                      onClick={() =>
                                        setSelectedAnswers((current) => ({
                                          ...current,
                                          [question.id]: optionIndex,
                                        }))
                                      }
                                    >
                                      <span>
                                        {String.fromCharCode(65 + optionIndex)}
                                      </span>
                                      <p>{option}</p>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              {isAnswered ? (
                                <p
                                  className={`ar-info-questions__feedback ${isCorrect ? "is-correct" : "is-incorrect"}`}
                                  role="status"
                                >
                                  {isCorrect
                                    ? "Chính xác!"
                                    : "Chưa đúng. Đáp án đúng đã được đánh dấu."}
                                </p>
                              ) : (
                                <button
                                  className="ar-info-questions__answer"
                                  type="button"
                                  aria-expanded={isRevealed}
                                  onClick={() =>
                                    setRevealedAnswers((current) => ({
                                      ...current,
                                      [question.id]: !current[question.id],
                                    }))
                                  }
                                >
                                  {isRevealed ? "Ẩn đáp án" : "Xem đáp án"}
                                </button>
                              )}
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </div>
          </article>
        )}
      </Modal>
    </main>
  );
}

export default ArExperiencePage;
