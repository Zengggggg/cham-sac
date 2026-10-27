import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CircleAlert,
  MapPin,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { listMyOrders } from "../../services/shopService.js";
import "./MyOrderPage.scss";

const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", tone: "pending" },
  confirmed: { label: "Đã xác nhận", tone: "confirmed" },
  shipping: { label: "Đang giao", tone: "shipping" },
  done: { label: "Hoàn tất", tone: "done" },
  cancelled: { label: "Đã hủy", tone: "cancelled" },
};

const PAYMENT_STATUS = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)}đ`;

const formatDate = (value) => {
  if (!value) return "Ngày đặt chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ngày đặt chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
};

function OrderCard({ order }) {
  const status = ORDER_STATUS[order.orderStatus] || {
    label: "Chưa cập nhật",
    tone: "pending",
  };
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );
  const address = order.shippingAddress || {};
  const addressText = [
    address.addressLine || address.address,
    address.ward,
    address.province,
  ]
    .filter(Boolean)
    .join(", ");
  const paymentLabel =
    order.paymentMethod === "cod"
      ? "Thanh toán khi nhận hàng"
      : order.paymentMethod === "bank"
        ? "Chuyển khoản ngân hàng"
        : PAYMENT_STATUS[order.paymentStatus] || "Phương thức chưa cập nhật";

  return (
    <Card className="my-order-card">
      <div className="my-order-card__header">
        <div>
          <span className="my-order-card__eyebrow">Mã đơn hàng</span>
          <h2>#{order.orderCode || order._id || "Chưa có mã"}</h2>
        </div>
        <span className={`my-order-status my-order-status--${status.tone}`}>
          <span className="my-order-status__dot" aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <div className="my-order-card__meta">
        <span><CalendarDays size={15} aria-hidden="true" /> {formatDate(order.createdAt)}</span>
        <span><PackageCheck size={15} aria-hidden="true" /> {itemCount} sản phẩm</span>
        <span><Banknote size={15} aria-hidden="true" /> {paymentLabel}</span>
        {addressText && <span><MapPin size={15} aria-hidden="true" /> {addressText}</span>}
      </div>

      {items.length > 0 && (
        <ul className="my-order-card__items">
          {items.map((item, index) => (
            <li key={`${item.productId || item.productName || "item"}-${index}`}>
              <span>{item.productName || "Sản phẩm"} <b>× {item.quantity || 0}</b></span>
              <strong>
                {formatMoney(Number(item.unitPrice || 0) * Number(item.quantity || 0))}
              </strong>
            </li>
          ))}
        </ul>
      )}

      <div className="my-order-card__footer">
        <span>{PAYMENT_STATUS[order.paymentStatus] || "Trạng thái thanh toán chưa cập nhật"}</span>
        <strong>{formatMoney(order.totalAmount)}</strong>
      </div>
    </Card>
  );
}

function MyOrderPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    listMyOrders()
      .then((response) => {
        if (active) setOrders(response.data || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Không thể tải đơn hàng.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleOrders = useMemo(
    () =>
      statusFilter === "all"
        ? orders
        : orders.filter(
            (order) => String(order.orderStatus || "").toLowerCase() === statusFilter,
          ),
    [orders, statusFilter],
  );

  const emptyTitle =
    orders.length === 0 ? "Bạn chưa có đơn hàng nào" : "Chưa có đơn hàng phù hợp";
  const emptyDescription =
    orders.length === 0
      ? "Các đơn hàng của bạn sẽ xuất hiện tại đây sau khi được tạo."
      : "Thử chọn trạng thái khác để xem các đơn hàng.";

  return (
    <main className="my-order-page">
      <div className="my-order-shell">
        <button className="my-order-back" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Quay lại
        </button>

        <header className="my-order-hero">
          <div className="my-order-hero__copy">
            <p className="my-order-kicker"><PackageCheck size={17} aria-hidden="true" /> Đơn hàng của bạn</p>
            <h1>Đơn hàng của bạn</h1>
            <p>Theo dõi trạng thái và sản phẩm trong các đơn hàng của bạn.</p>
          </div>
          <div className="my-order-count" aria-label={`${orders.length} đơn hàng`}>
            <strong>{orders.length}</strong>
            <span>đơn hàng</span>
          </div>
        </header>

        <section className="my-order-toolbar" aria-label="Bộ lọc đơn hàng">
          <div className="my-order-toolbar__copy">
            <strong>Lịch sử đơn hàng</strong>
            <span>{visibleOrders.length} đơn hàng đang hiển thị</span>
          </div>
          <div className="my-order-filter">
            <select
              aria-label="Lọc theo trạng thái đơn hàng"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(ORDER_STATUS).map(([value, status]) => (
                <option value={value} key={value}>{status.label}</option>
              ))}
            </select>
          </div>
        </section>

        {isLoading ? (
          <Card className="my-order-empty" role="status"><h2>Đang tải đơn hàng</h2></Card>
        ) : error ? (
          <Card className="my-order-empty" role="alert"><CircleAlert size={26} aria-hidden="true" /><h2>Không thể tải đơn hàng</h2><p>{error}</p><Button variant="primary" onClick={() => navigate("/login")}>Đăng nhập lại</Button></Card>
        ) : visibleOrders.length === 0 ? (
          <Card className="my-order-empty">
            <span className="my-order-empty__icon"><CircleAlert size={26} aria-hidden="true" /></span>
            <h2>{emptyTitle}</h2>
            <p>{emptyDescription}</p>
            {orders.length === 0 && (
              <Button
                variant="primary"
                icon={<ShoppingBag size={17} aria-hidden="true" />}
                onClick={() => navigate("/products")}
              >
                Khám phá sản phẩm
              </Button>
            )}
          </Card>
        ) : (
          <section className="my-order-list" aria-label="Danh sách đơn hàng">
            {visibleOrders.map((order) => (
              <OrderCard key={order._id || order.orderCode} order={order} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default MyOrderPage;
