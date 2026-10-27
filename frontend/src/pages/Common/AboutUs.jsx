import {
  ArrowRight,
  BookOpen,
  Camera,
  HeartHandshake,
  Image,
  Landmark,
  Map,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import FloatingCharacter from "../../components/layout/FloatingCharacter.jsx";
import elementFlag from "../../assets/elements/IMG_4820.PNG";
import elementRedFold from "../../assets/elements/IMG_4821.PNG";
import elementTealFold from "../../assets/elements/IMG_4822.PNG";
import elementMaskPurple from "../../assets/elements/IMG_4818.PNG";
import elementMaskBlue from "../../assets/elements/IMG_4819.PNG";
import elementFlowerOne from "../../assets/elements/IMG_4825.PNG";
import elementFlowerTwo from "../../assets/elements/IMG_4826.PNG";
import productImage from "../../assets/product.png";
import statementBackground from "../../assets/aboutus_1.png";
import "./AboutUs.scss";

const values = [
  {
    icon: Landmark,
    title: "Trân trọng văn hóa Việt",
    description:
      "Tìm hiểu và chọn lọc thông tin về danh lam thắng cảnh, di tích lịch sử và đặc trưng vùng miền để truyền tải những giá trị văn hóa một cách gần gũi, phù hợp.",
  },
  {
    icon: HeartHandshake,
    title: "Lấy gia đình làm trung tâm",
    description:
      "Thiết kế trải nghiệm để cha mẹ và con cùng tham gia, tương tác và tận hưởng thời gian bên nhau qua mỗi ván chơi.",
  },
  {
    icon: Sparkles,
    title: "Chạm đến trải nghiệm mới",
    description:
      "Ứng dụng WebAR để bổ sung hình ảnh, mô hình 3D và âm thanh sống động, giúp khám phá văn hóa trực quan mà vẫn giữ board game làm trải nghiệm chính.",
  },
];

const journeySteps = [
  {
    icon: Map,
    number: "01",
    title: "Chọn một điểm chạm",
    description:
      "Bắt đầu từ một vùng đất, hiện vật hoặc câu chuyện khiến bạn tò mò.",
  },
  {
    icon: Camera,
    number: "02",
    title: "Mở trải nghiệm AR",
    description:
      "Đưa camera đến hình ảnh nhận diện để khám phá lớp nội dung tương tác.",
  },
  {
    icon: BookOpen,
    number: "03",
    title: "Đọc và kể tiếp",
    description:
      "Tìm hiểu bối cảnh, ghi nhớ điều thú vị và chia sẻ câu chuyện theo cách của bạn.",
  },
];

const milestones = [
  {
    year: "20XX",
    title: "Khởi đầu ý tưởng",
    description: "Placeholder mô tả cột mốc đầu tiên của dự án.",
  },
  {
    year: "20XX",
    title: "Mở rộng trải nghiệm",
    description: "Placeholder mô tả giai đoạn phát triển tiếp theo.",
  },
  {
    year: "20XX",
    title: "Kết nối công nghệ",
    description: "Placeholder mô tả bước đưa AR vào hành trình khám phá.",
  },
  {
    year: "20XX",
    title: "Tiếp tục di sản",
    description: "Placeholder cho định hướng phát triển trong tương lai.",
  },
];

const teamMembers = [
  { name: "Tạ Hoàng", role: "Điều phối dự án", initials: "MĐ", tone: "gold" },
  { name: "Giang Hoàng", role: "Nhà phát triển", initials: "GH", tone: "pink" },
  { name: "Nhật Hoàng", role: "Nhà phát triển", initials: "ĐN", tone: "teal" },
];

const carouselMembers = [
  ...teamMembers,
  {
    name: "\u004e\u1ed9i dung di s\u1ea3n",
    role: "\u0110ang c\u1eadp nh\u1eadt",
    initials: "ND",
    tone: "purple",
  },
  {
    name: "Thi\u1ebft k\u1ebf tr\u1ea3i nghi\u1ec7m",
    role: "\u0110ang c\u1eadp nh\u1eadt",
    initials: "TK",
    tone: "orange",
  },
  {
    name: "K\u1ebft n\u1ed1i c\u1ed9ng \u0111\u1ed3ng",
    role: "\u0110ang c\u1eadp nh\u1eadt",
    initials: "KC",
    tone: "blue",
  },
];

function AboutUs() {
  return (
    <main className="about-page">
      <section className="about-page__hero">
        <img
          className="about-page__page-element about-page__page-element--hero-flag"
          src={elementFlag}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__flower-doodle about-page__flower-doodle--hero"
          src={elementFlowerOne}
          alt=""
          aria-hidden="true"
        />
        <div className="about-page__shell about-page__hero-grid">
          <div className="about-page__hero-copy">
            <p className="about-page__eyebrow">
              <Sparkles size={16} aria-hidden="true" /> VỀ CHẠM SẮC VIỆT
            </p>
            <h1>
              Đi qua mọi miền,
              <br />
              <span className="about-page__hero-title-line">
                nối liền yêu thương
              </span>
            </h1>
            <p className="about-page__lead">
              Một không gian số giúp bạn khám phá văn hóa và di sản Việt Nam qua
              những trải nghiệm trực quan, gần gũi và giàu cảm hứng.
            </p>
            <div className="about-page__hero-actions">
              <Button
                as={Link}
                to="/introduce-hlw26"
                icon={<ArrowRight size={17} aria-hidden="true" />}
                iconPosition="right"
              >
                Bắt đầu khám phá
              </Button>
              <Button as={Link} to="/contact-us" variant="secondary">
                Liên hệ với chúng mình
              </Button>
            </div>
          </div>

          <div
            className="about-page__visual-placeholder"
            role="img"
            aria-label="Ảnh minh họa placeholder về di sản Việt Nam"
          >
            <FloatingCharacter variant={2} className="about-page__character" />
            <div className="about-page__visual-frame">
              <img
                className="about-page__product-image"
                src={productImage}
                alt="Sản phẩm Chạm Sắc Việt"
              />
            </div>
            <span className="about-page__visual-stamp">
              CHẠM
              <br />
              SẮC
              <br />
              VIỆT
            </span>
          </div>
        </div>
      </section>

      <section
        className="about-page__timeline"
        aria-label="Dòng thời gian Chạm Sắc Việt"
      >
        <FloatingCharacter
          variant={1}
          className="about-page__timeline-character"
        />
        <span className="about-page__timeline-watermark" aria-hidden="true">
          DI SẢN
        </span>
        <img
          className="about-page__page-element about-page__page-element--timeline-teal"
          src={elementTealFold}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__flower-doodle about-page__flower-doodle--timeline"
          src={elementFlowerTwo}
          alt=""
          aria-hidden="true"
        />
        <div className="about-page__shell">
          <div className="about-page__timeline-grid">
            {milestones.map(({ year, title, description }) => (
              <article
                className="about-page__milestone"
                key={`${year}-${title}`}
              >
                <strong>{year}</strong>
                <h2>{title}</h2>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="about-page__statement"
        style={{ "--statement-background": `url(${statementBackground})` }}
        aria-label="Tuyên ngôn Chạm Sắc Việt"
      >
        <FloatingCharacter
          variant={3}
          className="about-page__statement-character"
        />
        <img
          className="about-page__statement-element about-page__statement-element--flag"
          src={elementFlag}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__statement-element about-page__statement-element--teal"
          src={elementTealFold}
          alt=""
          aria-hidden="true"
        />
        <div className="about-page__shell about-page__statement-content">
          <p className="about-page__eyebrow">TINH THẦN CHẠM SẮC VIỆT</p>
          <blockquote>
            “Cùng nhau khám phá{" "}
            <span style={{ whiteSpace: "nowrap" }}>Việt Nam</span>, cùng nhau
            lưu giữ những khoảnh khắc đẹp”
          </blockquote>
          <span className="about-page__statement-caption">
            Kết nối gia đình qua từng cuộc chơi
          </span>
        </div>
      </section>

      <section className="about-page__team" aria-labelledby="about-team-title">
        <img
          className="about-page__team-element about-page__team-element--teal"
          src={elementTealFold}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__flower-doodle about-page__flower-doodle--team"
          src={elementFlowerOne}
          alt=""
          aria-hidden="true"
        />
        <div className="about-page__shell">
          <div className="about-page__team-heading">
            <div>
              <p className="about-page__eyebrow">
                <UsersRound size={16} aria-hidden="true" /> ĐỘI NGŨ CHẠM SẮC
                VIỆT
              </p>
              <h2 id="about-team-title">Những người kể chuyện di sản</h2>
            </div>
            <p>
              Đằng sau mỗi trải nghiệm là một nhóm người cùng chia sẻ niềm yêu
              thích với văn hóa, công nghệ và những câu chuyện Việt Nam.
            </p>
          </div>

          <div
            className="about-page__team-carousel"
            aria-label="Đội ngũ Chạm Sắc Việt"
          >
            <div className="about-page__team-track">
              {[0, 1].map((group) => (
                <div
                  className="about-page__team-group"
                  key={group}
                  aria-hidden={group === 1}
                >
                  {carouselMembers.map(({ name, role, initials, tone }) => (
                    <Card
                      className="about-page__team-card"
                      key={`${group}-${name}`}
                    >
                      <div
                        className={`about-page__team-portrait about-page__team-portrait--${tone}`}
                        role="img"
                        aria-label={`Ảnh placeholder của ${name}`}
                      >
                        <Image size={30} aria-hidden="true" />
                        <strong>{initials}</strong>
                        <span>Ảnh đội ngũ</span>
                      </div>
                      <div className="about-page__team-card-copy">
                        <h3>{name}</h3>
                        <p>{role}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-page__section about-page__section--light">
        <img
          className="about-page__page-element about-page__page-element--belief-red"
          src={elementRedFold}
          alt=""
          aria-hidden="true"
        />
        <div className="about-page__shell about-page__belief-grid">
          <div className="about-page__section-heading">
            <p className="about-page__eyebrow">CÂU CHUYỆN CỦA CHÚNG MÌNH</p>
            <h2>Chạm sắc Việt - Kết nối gia đình qua từng cuộc chơi</h2>
          </div>
          <div className="about-page__belief-copy">
            <p>
              Chạm Sắc Việt ra đời từ mong muốn đưa văn hóa Việt Nam đến gần hơn
              với các gia đình thông qua những trải nghiệm vui chơi ý nghĩa.
              Chúng mình tin rằng, những câu chuyện về danh lam thắng cảnh, di
              tích lịch sử và vẻ đẹp của từng vùng miền sẽ trở nên gần gũi hơn
              khi được khám phá qua những khoảnh khắc vui chơi bên nhau.
            </p>
            <p>
              Từ đó, Hành Trình Xuyên Việt được hình thành – một trò chơi board
              game đưa cha mẹ và con trẻ cùng du hành từ Hà Nội đến TP. Hồ Chí
              Minh, vượt qua thử thách, lựa chọn chiến thuật và khám phá những
              nét đặc sắc của quê hương. Với WebAR bổ trợ bằng hình ảnh, mô hình
              3D và âm thanh, hành trình khám phá văn hóa trở nên sinh động hơn
              mà không làm mất đi niềm vui tương tác trực tiếp.
            </p>
            <p style={{ fontWeight: "bold" }}>
              Với Chạm Sắc Việt, chúng mình không muốn biến giờ chơi thành giờ
              học, mà mong mỗi ván chơi sẽ là dịp để gia đình cùng cười, cùng
              khám phá và tạo nên những kỷ niệm đáng nhớ.
            </p>
          </div>
        </div>
      </section>

      <section className="about-page__section">
        <img
          className="about-page__flower-doodle about-page__flower-doodle--values-top-left"
          src={elementFlowerOne}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__flower-doodle about-page__flower-doodle--values"
          src={elementFlowerTwo}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__page-element about-page__page-element--values-teal"
          src={elementTealFold}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__page-element about-page__page-element--values-red"
          src={elementRedFold}
          alt=""
          aria-hidden="true"
        />
        <div className="about-page__shell">
          <div className="about-page__center-heading">
            <p className="about-page__eyebrow">
              GIÁ TRỊ CỐT LÕI
            </p>
            <h2>Giá trị tạo nên Chạm Sắc Việt</h2>
            <p>
              Từ cách gìn giữ văn hóa đến cách tạo nên những trải nghiệm ý nghĩa cho mỗi gia đình.
            </p>
          </div>

          <div className="about-page__values-grid">
            {values.map(({ icon: Icon, title, description }) => (
              <Card className="about-page__value-card" key={title}>
                <span className="about-page__icon-tile">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="about-page__section about-page__section--ink">
        <img
          className="about-page__page-element about-page__page-element--journey-flag"
          src={elementFlag}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__flower-doodle about-page__flower-doodle--journey-top-right"
          src={elementFlowerTwo}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__page-element about-page__page-element--journey-teal"
          src={elementTealFold}
          alt=""
          aria-hidden="true"
        />
        <img
          className="about-page__flower-doodle about-page__flower-doodle--journey"
          src={elementFlowerOne}
          alt=""
          aria-hidden="true"
        />
        <div className="about-page__shell">
          <div className="about-page__center-heading about-page__center-heading--ink">
            <p className="about-page__eyebrow">HÀNH TRÌNH KHÁM PHÁ</p>
            <h2>Một cách mới để bước vào câu chuyện di sản.</h2>
            <p>
              Khám phá từng lớp thông tin theo nhịp riêng của bạn, từ một hình
              ảnh nhỏ đến cả bối cảnh văn hóa phía sau.
            </p>
          </div>

          <div className="about-page__journey-grid">
            {journeySteps.map(({ icon: Icon, number, title, description }) => (
              <article className="about-page__journey-card" key={number}>
                <span className="about-page__journey-number">{number}</span>
                <span className="about-page__journey-icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-page__section about-page__section--cta">
        <FloatingCharacter variant={0} className="about-page__cta-character" />
        <div className="about-page__shell about-page__cta">
          <div className="about-page__cta-copy">
            <p className="about-page__eyebrow">
              <Sparkles size={16} aria-hidden="true" /> ĐỒNG HÀNH CÙNG DI SẢN
            </p>
            <h2>Let&apos;s play!</h2>
            <p>
              Chia sẻ ý tưởng của bạn và cùng Chạm Sắc Việt tạo nên trải nghiệm
              di sản tiếp theo.
            </p>
            <div
              className="about-page__cta-tags"
              aria-label="Các lĩnh vực đồng hành"
            >
              <Link to="/products">Nội dung di sản</Link>
              <Link to="/ar">Trải nghiệm AR</Link>
              <Link to="/faq">Kể chuyện văn hóa</Link>
              <Link to="/contact-us">Cộng đồng khám phá</Link>
            </div>
            <Button
              as={Link}
              to="/contact-us"
              variant="secondary"
              icon={<ArrowRight size={17} aria-hidden="true" />}
              iconPosition="right"
            >
              Khám phá ngay
            </Button>
          </div>

          <div className="about-page__cta-collage" aria-hidden="true">
            <div className="about-page__cta-collage-card about-page__cta-collage-card--purple">
              <img src={elementMaskPurple} alt="" />
            </div>
            <div className="about-page__cta-collage-card about-page__cta-collage-card--blue">
              <img src={elementMaskBlue} alt="" />
            </div>
            <img
              className="about-page__cta-collage-element about-page__cta-collage-element--flag"
              src={elementFlag}
              alt=""
            />
            <img
              className="about-page__cta-collage-element about-page__cta-collage-element--teal"
              src={elementTealFold}
              alt=""
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AboutUs;
