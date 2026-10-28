import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import Button from "../ui/Button.jsx";
import Modal from "../ui/Modal.jsx";
import { getStoredUser } from "../../services/apiClient.js";
import brandMark from "../../assets/wtm.png";
import characterWelcome from "../../assets/characters/image-removebg-preview (1).png";
import characterFeatures from "../../assets/characters/image-removebg-preview (2).png";
import characterComplete from "../../assets/characters/image-removebg-preview (3).png";
import "./OnboardingTour.scss";

const TOUR_STORAGE_KEY = "cham-sac-onboarding-complete";

const tourSteps = [
  {
    target: '[data-onboarding-target="home"]',
    title: "Trang chủ",
    text: "Quay về trang chủ để bắt đầu hành trình khám phá.",
  },
  {
    target: '[data-onboarding-target="products"]',
    title: "Mua sắm",
    text: "Khám phá các vật phẩm của bộ trò chơi",
  },
  {
    target: '[data-onboarding-target="ar"]',
    title: "Trải nghiệm AR",
    text: " Sử dụng ngay 'Công nghệ AR' siêu hiện đại để nhìn ngắm các địa danh Việt",
  },
  {
    target: '[data-onboarding-target="about"]',
    title: "Về chúng mình",
    text: "Tìm hiểu câu chuyện và sứ mệnh của Chạm Sắc Việt.",
  },
  {
    target: '[data-onboarding-target="contact"]',
    title: "Liên hệ",
    text: "Chúng tớ xin tích cực nhận những câu hỏi và đóng góp của người chơi để gia tăng trải nghiệm người dùng ạ!",
  },
  {
    target: '[data-onboarding-target="cart"]',
    title: "Giỏ hàng",
    text: "Cùng xem lại giỏ hàng của bạn có những gì nhé!",
  },
  {
    target: '[data-onboarding-target="account"]',
    title: "Tài khoản",
    text: "Quản lý hồ sơ, đơn hàng và các thiết lập cá nhân.",
  },
  {
    target: '[data-onboarding-target="support-actions"]',
    title: "Hỗ trợ nhanh",
    text: "Nhắn tin với Chạm Sắc Việt qua Messenger hoặc xem Câu hỏi thường gặp để tìm câu trả lời nhanh.",
    centered: true,
    spotlight: "pill",
    spotlightPadding: 10,
  },
];

export default function OnboardingTour() {
  const [, setUser] = useState(getStoredUser);
  const [phase, setPhase] = useState(() =>
    localStorage.getItem(TOUR_STORAGE_KEY) ? null : "welcome",
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const dismiss = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "1");
    setPhase(null);
    setTargetRect(null);
  }, []);

  useEffect(() => {
    const handleLogin = () => {
      const nextUser = getStoredUser();
      setUser(nextUser);
      if (!localStorage.getItem(TOUR_STORAGE_KEY)) {
        setStepIndex(0);
        setPhase("welcome");
      }
    };
    const handleLogout = () => {
      setUser(null);
      setPhase(null);
    };
    window.addEventListener("auth:login", handleLogin);
    window.addEventListener("auth:logout", handleLogout);
    return () => {
      window.removeEventListener("auth:login", handleLogin);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const activeStep = tourSteps[stepIndex];

  useEffect(() => {
    if (phase !== "tour" || !activeStep) return undefined;
    const updateTarget = () => {
      const target = document.querySelector(activeStep.target);
      if (!target) {
        setTargetRect(null);
        return;
      }
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
      const rect = target.getBoundingClientRect();
      const spotlightPadding = activeStep.spotlightPadding ?? 0;
      setTargetRect({
        top: rect.top - spotlightPadding,
        left: rect.left - spotlightPadding,
        width: rect.width + spotlightPadding * 2,
        height: rect.height + spotlightPadding * 2,
      });
    };
    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [activeStep, phase]);

  if (!phase) return null;

  if (phase === "welcome") {
    return (
      <Modal
        open
        onClose={dismiss}
        showClose={false}
        className="onboarding-dialog"
        title="Xin chào cả nhà !"
        description="Chào mừng các bạn tới ngôi nhà xinh iu của Chạm Sắc Việt"
        actions={
          <>
            <Button variant="secondary" onClick={dismiss}>
              Bỏ qua
            </Button>
            <Button onClick={() => setPhase("features")}>Tiếp tục</Button>
          </>
        }
      >
        <div className="onboarding-intro">
          <img
            className="onboarding-character"
            src={characterWelcome}
            alt=""
            aria-hidden="true"
          />
          <img
            className="onboarding-intro__logo"
            src={brandMark}
            alt="Chạm Sắc Việt"
          />
          <p>
            Hãy cùng tớ khám phá Việt Nam qua những cung nẻo đường của trò chơi
            đầy thách thức này nhé!!!
          </p>
        </div>
      </Modal>
    );
  }

  if (phase === "features") {
    return (
      <Modal
        open
        onClose={dismiss}
        showClose={false}
        className="onboarding-dialog"
        title="Điểm nổi bật của dự án"
        description="Mọi thứ bạn cần để bắt đầu khám phá"
        actions={
          <>
            <Button variant="secondary" onClick={dismiss}>
              Bỏ qua
            </Button>
            <Button onClick={() => setPhase("tour")}>Đi thôi nào!</Button>
          </>
        }
      >
        <div className="onboarding-features">
          <img
            className="onboarding-character"
            src={characterFeatures}
            alt=""
            aria-hidden="true"
          />
          <div>
            <ShoppingBag size={20} />
            <span>
              <strong>Trước tiên hãy ghé thăm cửa hàng nhé!</strong>
              Mỗi món đồ đều có điều thú vị riêng. Biết đâu bạn sẽ tìm thấy một
              món quà đặc biệt cho hành trình của mình!
            </span>
          </div>
          <div>
            <Sparkles size={20} />
            <span>
              <strong>Cùng mình chạm vào di sản!</strong>
              Từ những công trình cổ kính đến các danh lam thắng cảnh nổi tiếng,
              mỗi nơi đều có một vẻ đẹp mang tình yêu của Việt Nam.
            </span>
          </div>
          <div>
            <UserRound size={20} />
            <span>
              <strong>Lưu lại hành trình của bạn</strong>
              Đăng nhập để lưu tài khoản, theo dõi đơn hàng và tiếp tục hành
              trình bất cứ khi nào bạn muốn nha!
            </span>
          </div>
        </div>
      </Modal>
    );
  }

  if (phase === "complete") {
    return (
      <Modal
        open
        onClose={dismiss}
        showClose={false}
        className="onboarding-dialog"
        title="Bạn đã khám phá xong"
        description="Giờ hãy bắt đầu hành trình cùng Chạm Sắc Việt nhé!"
        actions={<Button onClick={dismiss}>Khám phá ngay</Button>}
      >
        <div className="onboarding-intro">
          <img
            className="onboarding-character"
            src={characterComplete}
            alt=""
            aria-hidden="true"
          />
          <img
            className="onboarding-intro__logo"
            src={brandMark}
            alt="Chạm Sắc Việt"
          />
          <p>
            Bạn đã làm quen với những khu vực chính của website. Chúc bạn có một
            hành trình thật nhiều cảm hứng.
          </p>
        </div>
      </Modal>
    );
  }

  const nextStep = () => {
    if (stepIndex >= tourSteps.length - 1) setPhase("complete");
    else setStepIndex((index) => index + 1);
  };

  const isCenteredStep = activeStep.centered || !targetRect;

  return (
    <div
      className="onboarding-tour"
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn sử dụng Chạm Sắc Việt"
    >
      {targetRect && (
        <div
          className={`onboarding-tour__spotlight${activeStep.spotlight === "pill" ? " onboarding-tour__spotlight--pill" : ""}`}
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}
      <div
        className={`onboarding-tour__card${isCenteredStep ? " onboarding-tour__card--centered" : ""}${activeStep.centered ? " onboarding-tour__card--support" : ""}`}
        style={
          targetRect && !activeStep.centered
            ? {
                top:
                  targetRect.top > window.innerHeight / 2
                    ? Math.max(16, targetRect.top - 330)
                    : Math.min(
                        window.innerHeight - 300,
                        targetRect.top + targetRect.height + 18,
                      ),
                left: Math.max(
                  16,
                  Math.min(
                    window.innerWidth - 352,
                    targetRect.left + targetRect.width / 2 - 160,
                  ),
                ),
              }
            : undefined
        }
      >
        <p className="onboarding-tour__step">
          {stepIndex + 1} / {tourSteps.length}
        </p>
        <h2>{activeStep.title}</h2>
        <p>{activeStep.text}</p>
        <div className="onboarding-tour__actions">
          <Button variant="secondary" onClick={dismiss}>
            Bỏ qua
          </Button>
          <Button onClick={nextStep}>
            {stepIndex === tourSteps.length - 1 ? "Hoàn tất" : "Tiếp tục"}{" "}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
