import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  QrCode,
  RotateCcw,
  ShoppingBag,
  Timer,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { createPayment, getPaymentStatus } from "../../services/shopService.js";
import "./PaymentPage.scss";

const readStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const getPaymentContext = () => {
  const order = readStorage("current-order", null);
  const payment = readStorage("current-payment", null);
  return { checkout: order ? { paymentMethod: "bank" } : null, items: order?.items || [], order, payment };
};

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)}đ`;

const PAYMENT_TIMER_KEY = "cham-sac-payment-expires-at";
const PAYMENT_DURATION_MS = 15 * 60 * 1000;

function getPaymentExpiry() {
  const savedExpiry = Number(sessionStorage.getItem(PAYMENT_TIMER_KEY));
  if (Number.isFinite(savedExpiry) && savedExpiry > 0) return savedExpiry;

  const expiry = Date.now() + PAYMENT_DURATION_MS;
  sessionStorage.setItem(PAYMENT_TIMER_KEY, String(expiry));
  return expiry;
}

const formatCountdown = (milliseconds) => {
  const seconds = Math.ceil(milliseconds / 1000);
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = seconds % 60;
  return `${String(minutesPart).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")}`;
};

function PaymentVisual({ payment }) {
  return (
    <section
      className="payment-visual payment-visual--bank"
      aria-label="Khu vực mã QR thanh toán"
    >
      <div className="payment-visual__placeholder">
        <QrCode size={76} strokeWidth={1.3} aria-hidden="true" />
        <strong>Mã QR thanh toán</strong>
        <span>{payment?.qrCode ? "Mã VietQR đã được tạo. Mở cổng payOS để quét và thanh toán." : "Mở cổng payOS để hoàn tất thanh toán."}</span>
      </div>
    </section>
  );
}

function PaymentDetails({ total, remainingMs, onResetTimer, payment }) {
  const isExpired = remainingMs <= 0;

  return (
    <section className="payment-details" aria-label="Chi tiết thanh toán">
      <div className="payment-amount">
        <span>Số tiền cần thanh toán</span>
        <strong>{formatMoney(total)}</strong>
      </div>

      <div
        className={`payment-countdown${remainingMs <= 60_000 ? " payment-countdown--urgent" : ""}${isExpired ? " payment-countdown--expired" : ""}`}
        role="timer"
        aria-label={
          isExpired
            ? "Đã hết thời gian thanh toán"
            : `Còn ${formatCountdown(remainingMs)} để thanh toán`
        }
      >
        <Timer size={17} aria-hidden="true" />
        <span>
          {isExpired
            ? "Đã hết thời gian thanh toán"
            : "Thời gian thanh toán còn lại"}
        </span>
        <strong>{formatCountdown(remainingMs)}</strong>
      </div>

      <div className="payment-information">
        <h2>Thông tin chuyển khoản</h2>
        <div className="payment-information__row payment-information__row--placeholder">
          <span>Ngân hàng</span>
          <strong>payOS</strong>
        </div>
        <div className="payment-information__row payment-information__row--placeholder">
          <span>Mã giao dịch</span>
          <strong>{payment?.providerOrderCode || "—"}</strong>
        </div>
        <div className="payment-information__row payment-information__row--placeholder">
          <span>Tên tài khoản</span>
          <strong>Chạm Sắc Việt</strong>
        </div>
        <div className="payment-information__row payment-information__row--placeholder">
          <span>Nội dung chuyển khoản</span>
          <strong>{payment?.transferContent || "—"}</strong>
        </div>
        <div className="payment-information__row payment-information__row--total">
          <span>Tổng cộng</span>
          <strong>{formatMoney(total)}</strong>
        </div>
      </div>

      <div className="payment-actions">
        <Button
          variant="primary"
          disabled={isExpired || !payment?.checkoutUrl}
          icon={<CreditCard size={18} aria-hidden="true" />}
          onClick={() => window.location.assign(payment.checkoutUrl)}
        >
          Mở cổng thanh toán payOS
        </Button>
      </div>

      {isExpired && (
        <div className="payment-expiry-notice" role="status">
          <AlertCircle size={19} aria-hidden="true" />
          <span>
            Đơn hàng đã hết thời hạn thanh toán. Vui lòng xem trạng thái đơn hàng của bạn.
          </span>
          <Button
            variant="secondary"
            icon={<RotateCcw size={16} aria-hidden="true" />}
            onClick={onResetTimer}
          >
            Xem đơn hàng
          </Button>
        </div>
      )}

    </section>
  );
}

function PaymentResultCard({
  result,
  total,
  onBackToPayment,
  onContinueShopping,
}) {
  const isCashOnDelivery = result === "cod";
  const isSuccess = result === "success" || isCashOnDelivery;
  const ResultIcon = isSuccess ? CheckCircle2 : CircleAlert;

  return (
    <div
      className={`payment-result-card__content${isSuccess ? " payment-result-card__content--success" : " payment-result-card__content--failure"}`}
      role="status"
      aria-live="polite"
    >
      <span className="payment-result-card__icon">
        <ResultIcon size={38} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <p className="payment-result-card__eyebrow">
        Kết quả thanh toán
      </p>
      <h2>
        {isCashOnDelivery
          ? "Đặt hàng thành công"
          : isSuccess
            ? "Thanh toán thành công"
            : "Thanh toán chưa hoàn tất"}
      </h2>
      {isCashOnDelivery && (
        <p className="payment-result-card__followup">
          Shop sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng
        </p>
      )}
      <div className="payment-result-card__amount">
        <span>
          Tổng giá trị đơn hàng
        </span>
        <strong>{formatMoney(total)}</strong>
      </div>
      <Button
        variant="primary"
        onClick={isSuccess ? onContinueShopping : onBackToPayment}
      >
        {isSuccess
          ? "Xem đơn hàng của tôi"
          : "Quay lại thông tin chuyển khoản"}
      </Button>
    </div>
  );
}

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentContext] = useState(getPaymentContext);
  const { checkout, items, order, payment: storedPayment } = paymentContext;
  const [payment, setPayment] = useState(storedPayment);
  const isCashOnDelivery = false;
  const [paymentResult, setPaymentResult] = useState(() => location.pathname.endsWith("/cancel") ? "failure" : null);
  const [expiresAt] = useState(() =>
    checkout && items.length > 0 && !isCashOnDelivery
      ? Number.isNaN(Date.parse(order?.expiresAt)) ? getPaymentExpiry() : Date.parse(order.expiresAt)
      : Date.now() + PAYMENT_DURATION_MS,
  );
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, expiresAt - Date.now()),
  );

  useEffect(() => {
    const updateCountdown = () =>
      setRemainingMs(Math.max(0, expiresAt - Date.now()));
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  useEffect(() => {
    if (!order || payment) return undefined;
    let active = true;
    createPayment(order.id || order._id)
      .then((response) => {
        if (!active) return;
        setPayment(response.data.payment);
        localStorage.setItem("current-payment", JSON.stringify(response.data.payment));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [order, payment]);

  useEffect(() => {
    if (!order || paymentResult) return undefined;
    const orderId = order.id || order._id;
    const checkStatus = async () => {
      try {
        const response = await getPaymentStatus(orderId);
        if (response.data.paymentStatus === "paid") setPaymentResult("success");
        else if (response.data.orderStatus === "cancelled") setPaymentResult("failure");
      } catch {
        // Polling errors are transient; the main payment link remains usable.
      }
    };
    void checkStatus();
    const intervalId = window.setInterval(checkStatus, 5000);
    return () => window.clearInterval(intervalId);
  }, [order, paymentResult]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      ),
    [items],
  );
  const discount = Math.min(
    subtotal,
    Math.max(0, Number(checkout?.discount) || 0),
  );
  const total = Number(order?.totalAmount) || Math.max(0, subtotal - discount);

  const editOrder = () => {
    sessionStorage.removeItem(PAYMENT_TIMER_KEY);
    navigate("/checkout");
  };

  if (!checkout || items.length === 0) {
    return (
      <main className="payment-page">
        <div className="payment-shell">
          <Card className="payment-empty">
            <span className="payment-empty__icon">
              <ShoppingBag size={28} aria-hidden="true" />
            </span>
            <h1>Chưa có thông tin thanh toán</h1>
            <p>
              Hãy chọn sản phẩm và hoàn tất thông tin giao hàng trước khi đến
              bước này.
            </p>
            <Button variant="primary" onClick={() => navigate("/cart")}>
              Quay lại giỏ hàng
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <div className="payment-shell">
        <button className="payment-back" type="button" onClick={editOrder}>
          <ArrowLeft size={17} aria-hidden="true" />
          Quay lại xác nhận đơn hàng
        </button>

        <header className="payment-heading">
          <p className="payment-heading__eyebrow">
            {isCashOnDelivery ? (
              <CheckCircle2 size={16} aria-hidden="true" />
            ) : (
              <QrCode size={16} aria-hidden="true" />
            )}
            {isCashOnDelivery
              ? "Bước 2 / 2 · Xác nhận đặt hàng"
              : "Bước 2 / 2 · Chuyển khoản"}
          </p>
          <h1>
            {isCashOnDelivery ? "Đặt hàng thành công" : "Quét mã để thanh toán"}
          </h1>
          <p className="payment-heading__description">
            {isCashOnDelivery
              ? "Bạn đã chọn thanh toán khi nhận hàng."
              : "Hoàn tất thanh toán để xác nhận đơn hàng."}
          </p>
        </header>

        <Card
          className={`payment-card${paymentResult ? " payment-card--result" : ""}`}
        >
          {paymentResult ? (
            <PaymentResultCard
              result={paymentResult}
              total={total}
              onBackToPayment={() => setPaymentResult(null)}
              onContinueShopping={() => { localStorage.removeItem("current-order"); localStorage.removeItem("current-payment"); navigate("/my-orders"); }}
            />
          ) : (
            <div className="payment-card__layout">
              <PaymentVisual payment={payment} />
              <PaymentDetails
                total={total}
                remainingMs={remainingMs}
                onResetTimer={() => navigate("/my-orders")}
                payment={payment}
              />
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

export default PaymentPage;
