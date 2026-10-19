import {
  ArrowDown,
  ArrowRight,
  Compass,
  Building2,
  Castle,
  GraduationCap,
  Landmark,
  MapPin,
  Mountain,
  QrCode,
  Sparkles,
  Trees,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import brandMark from "../../assets/wtm.png";
import starArtifact from "../../assets/elements/IMG_4811.PNG";
import colorfulStarArtifact from "../../assets/elements/IMG_4814.PNG";
import diceArtifact from "../../assets/elements/IMG_4818.PNG";
import flagArtifact from "../../assets/elements/IMG_4820.PNG";
import "./HomePage.scss";

const landmarks = [
  {
    name: "Fansipan",
    location: "Sa Pa · Lào Cai",
    region: "Tây Bắc",
    fact: "Nóc nhà Đông Dương, cao 3.147,3 m giữa dãy Hoàng Liên Sơn.",
    tone: "gold",
    icon: Mountain,
  },
  {
    name: "Hồ Gươm",
    location: "Hà Nội",
    region: "Đồng bằng Bắc Bộ",
    fact: "Hồ Hoàn Kiếm gắn với truyền thuyết vua Lê Thái Tổ trả gươm báu.",
    tone: "pink",
    icon: Landmark,
  },
  {
    name: "Văn Miếu – Quốc Tử Giám",
    location: "Hà Nội",
    region: "Đồng bằng Bắc Bộ",
    fact: "Di tích lưu giữ dấu ấn giáo dục và truyền thống hiếu học của Việt Nam.",
    tone: "turquoise",
    icon: GraduationCap,
  },
  {
    name: "Cố đô Hoa Lư",
    location: "Ninh Bình",
    region: "Đồng bằng Bắc Bộ",
    fact: "Kinh đô của Đại Cồ Việt từ năm 968 đến năm 1010.",
    tone: "pink",
    icon: Castle,
  },
  {
    name: "Cố đô Huế",
    location: "Bên dòng sông Hương",
    region: "Miền Trung",
    fact: "Kinh đô triều Nguyễn bên sông Hương, lưu dấu quần thể kiến trúc cung đình.",
    tone: "gold",
    icon: Castle,
  },
  {
    name: "Cầu Rồng",
    location: "Đà Nẵng",
    region: "Miền Trung",
    fact: "Cây cầu hình rồng bắc qua sông Hàn, nổi bật với màn phun lửa và nước.",
    tone: "turquoise",
    icon: Waves,
  },
  {
    name: "Dinh Độc Lập",
    location: "TP. Hồ Chí Minh",
    region: "Nam Bộ",
    fact: "Công trình gắn với dấu mốc lịch sử ngày 30 tháng 4 năm 1975.",
    tone: "gold",
    icon: Building2,
  },
  {
    name: "Địa đạo Củ Chi",
    location: "TP. Hồ Chí Minh",
    region: "Nam Bộ",
    fact: "Hệ thống đường hầm thể hiện sự sáng tạo và tinh thần kiên cường.",
    tone: "pink",
    icon: Compass,
  },
  {
    name: "Mũi Cà Mau",
    location: "Cà Mau",
    region: "Nam Bộ",
    fact: "Vùng cực Nam đất liền với cảnh quan ven biển và hệ sinh thái rừng ngập mặn.",
    tone: "turquoise",
    icon: Trees,
  },
];

const steps = [
  {
    number: "01",
    title: "Chọn câu chuyện",
    description: "Bắt đầu với một địa danh trong hành trình Chạm Sắc Việt.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Quét mã trên sản phẩm",
    description: "Dùng điện thoại quét QR tương ứng trên bộ sản phẩm.",
    icon: QrCode,
  },
  {
    number: "03",
    title: "Mở trải nghiệm AR",
    description: "Khám phá câu chuyện di sản qua nội dung tương tác trên web.",
    icon: Sparkles,
  },
];

function HomePage() {
  const scrollToJourney = (event) => {
    const journey = document.getElementById("hanh-trinh");
    if (!journey) return;

    event.preventDefault();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    journey.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-eyebrow">
              <Sparkles size={17} aria-hidden="true" /> Hành trình văn hoá Việt
              Nam
            </p>
            <h1 id="home-hero-title">
              Chạm vào di sản,
              <br />
              <span>mở lối khám phá.</span>
            </h1>
            <p className="home-hero__lead">
              Qua boardgame và trải nghiệm AR, khám phá chín địa danh cùng những
              lát cắt lịch sử, kiến trúc và thiên nhiên Việt Nam.
            </p>
            <div className="home-hero__actions">
              <Button
                as="a"
                href="#hanh-trinh"
                onClick={scrollToJourney}
                size="lg"
                icon={<ArrowDown size={18} aria-hidden="true" />}
                iconPosition="right"
              >
                Khám phá hành trình
              </Button>
              <Button
                as={Link}
                to="/products"
                variant="secondary"
                size="lg"
                icon={<ArrowRight size={18} aria-hidden="true" />}
                iconPosition="right"
              >
                Ghé cửa hàng
              </Button>
            </div>
            <div className="home-hero__note">
              <span className="home-hero__note-dot" aria-hidden="true" />
              Từ miền núi phía Bắc đến cực Nam Tổ quốc
            </div>
          </div>

          <div
            className="home-hero__art"
            aria-label="Nhận diện thương hiệu Chạm Sắc Việt"
          >
            <span
              className="home-hero__orbit home-hero__orbit--one"
              aria-hidden="true"
            />
            <span
              className="home-hero__orbit home-hero__orbit--two"
              aria-hidden="true"
            />
            <span className="home-hero__sun" aria-hidden="true" />
            <img className="home-hero__star" src={starArtifact} alt="" />
            <img
              className="home-hero__star-color"
              src={colorfulStarArtifact}
              alt=""
            />
            <img
              className="home-hero__brand"
              src={brandMark}
              alt="Chạm Sắc Việt"
            />
            <div className="home-hero__stamp">
              <MapPin size={15} aria-hidden="true" /> 09 địa danh
            </div>
            <span className="home-hero__caption">Di sản trong tầm tay</span>
          </div>
        </div>
        <a
          className="home-hero__scroll"
          href="#hanh-trinh"
          onClick={scrollToJourney}
          aria-label="Cuộn đến hành trình địa danh"
        >
          <span>Cuộn để khám phá</span>
          <ArrowDown size={16} aria-hidden="true" />
        </a>
      </section>

      <section
        className="home-journey"
        id="hanh-trinh"
        aria-labelledby="home-journey-title"
      >
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">
              <MapPin size={17} aria-hidden="true" /> Bản đồ câu chuyện
            </p>
            <h2 id="home-journey-title">
              Một Việt Nam,
              <br />
              <span>chín miền ký ức.</span>
            </h2>
          </div>
          <p className="home-section-heading__intro">
            Từ đỉnh núi phía Bắc đến vùng rừng ngập mặn phương Nam, mỗi điểm
            dừng hé lộ một dấu ấn riêng của đất nước.
          </p>
        </div>

        <div className="home-landmark-grid">
          {landmarks.map((landmark, index) => {
            const LandmarkIcon = landmark.icon;

            return (
              <Card
                key={landmark.name}
                className={`home-landmark home-landmark--${landmark.tone}`}
                eyebrow={`${String(index + 1).padStart(2, "0")} / ${landmark.region}`}
                title={landmark.name}
                description={landmark.location}
              >
                <LandmarkIcon className="home-landmark__icon" size={20} aria-hidden="true" />
                <p>{landmark.fact}</p>
                <span className="home-landmark__index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </Card>
            );
          })}
        </div>
        <div className="home-journey__footer">
          <span>Đi một vòng Việt Nam, nghe chín câu chuyện.</span>
          <Button
            as={Link}
            to="/products"
            variant="secondary"
            icon={<ArrowRight size={17} aria-hidden="true" />}
            iconPosition="right"
          >
            Khám phá ngay
          </Button>
        </div>
      </section>

      <section className="home-ar" aria-labelledby="home-ar-title">
        <div className="home-ar__visual" aria-hidden="true">
          <div className="home-ar__ring home-ar__ring--outer" />
          <div className="home-ar__ring home-ar__ring--inner" />
          <div className="home-ar__qr">
            <QrCode size={82} strokeWidth={1.2} />
          </div>
          <img className="home-ar__dice" src={diceArtifact} alt="" />
          <span className="home-ar__spark home-ar__spark--one">✳</span>
          <span className="home-ar__spark home-ar__spark--two">✦</span>
          <span className="home-ar__label">Chạm · Quét · Khám phá</span>
        </div>
        <div className="home-ar__content">
          <p className="home-eyebrow">
            <Sparkles size={17} aria-hidden="true" /> Công nghệ gặp di sản
          </p>
          <h2 id="home-ar-title">
            Câu chuyện xưa,
            <br />
            <span>cách khám phá mới.</span>
          </h2>
          <p>
            Bộ sản phẩm kết nối trò chơi và những câu chuyện địa danh. Quét QR
            trên sản phẩm để mở lối đến nội dung và trải nghiệm AR ngay trên
            web.
          </p>
          <div className="home-ar__steps">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div className="home-ar__step" key={number}>
                <span className="home-ar__step-icon">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <div>
                  <span className="home-ar__step-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            as={Link}
            to="/products"
            size="lg"
            icon={<ArrowRight size={18} aria-hidden="true" />}
            iconPosition="right"
          >
            Tới trang AR ngay
          </Button>
        </div>
      </section>

      <section className="home-final-cta" aria-label="Khám phá cửa hàng">
        <img className="home-final-cta__element" src={flagArtifact} alt="" />
        <div>
          <p className="home-eyebrow">Mang câu chuyện Việt về nhà</p>
          <h2>Một hành trình đang chờ bạn.</h2>
        </div>
        <Button
          as={Link}
          to="/products"
          icon={<ArrowRight size={18} aria-hidden="true" />}
          iconPosition="right"
        >
          Cùng đi tới những miền di sản thôi!
        </Button>
      </section>
    </div>
  );
}

export default HomePage;
