import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import ConfirmModal from "../../components/layout/ConfirmModal.jsx";
import { createOrder, createPayment, getCart } from "../../services/shopService.js";
import { normalizeCartItems } from "../../utils/cart.js";
import "./CheckOutPage.scss";

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)}đ`;

const readStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const normalizePhone = (phone) => {
  const compact = phone.replace(/[\s.-]/g, "");
  return compact.startsWith("0") ? `+84${compact.slice(1)}` : compact;
};

const getInitialCustomer = () => {
  const user = readStorage("user", {});
  return {
    fullName: user.fullName || user.full_name || user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  };
};

function CheckOutPage() {
  const navigate = useNavigate();
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [customer, setCustomer] = useState(getInitialCustomer);
  const [errors, setErrors] = useState({});
  const [coupon, setCoupon] = useState("");
  const [discount] = useState(0);
  const [step, setStep] = useState(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [delivery, setDelivery] = useState(() => {
    const saved = readStorage("checkout-info", {});
    return {
      city: saved.city || "",
      cityCode: saved.cityCode || "",
      ward: saved.ward || "",
      address: saved.address || "",
      note: saved.note || "",
    };
  });
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingWards, setIsLoadingWards] = useState(() =>
    Boolean(readStorage("checkout-info", {}).cityCode),
  );
  const [locationError, setLocationError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(
    "bank",
  );

  useEffect(() => {
    let active = true;
    getCart()
      .then((response) => {
        if (active) setCheckoutItems(normalizeCartItems(response.data.cart).filter((item) => item.selected));
      })
      .catch((error) => {
        if (active) toast.error(error.message || "Không thể tải giỏ hàng.");
      })
      .finally(() => {
        if (active) setIsLoadingCart(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("https://provinces.open-api.vn/api/v2/")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load provinces");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProvinces(data);
          setLocationError("");
        }
      })
      .catch(() => {
        if (!cancelled)
          setLocationError(
            "Không tải được danh sách tỉnh / thành phố. Vui lòng tải lại trang.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProvinces(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!delivery.cityCode) {
      return undefined;
    }

    let cancelled = false;
    fetch(`https://provinces.open-api.vn/api/v2/p/${delivery.cityCode}?depth=2`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load wards");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setWards(data.wards || []);
          setLocationError("");
        }
      })
      .catch(() => {
        if (!cancelled)
          setLocationError(
            "Không tải được danh sách phường / xã. Vui lòng chọn lại tỉnh / thành phố.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWards(false);
      });

    return () => {
      cancelled = true;
    };
  }, [delivery.cityCode]);

  const subtotal = useMemo(
    () =>
      checkoutItems.reduce(
        (total, item) =>
          total + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      ),
    [checkoutItems],
  );
  const total = Math.max(0, subtotal - discount);

  const updateCustomer = ({ target }) => {
    setCustomer((current) => ({ ...current, [target.name]: target.value }));
    setErrors((current) => ({ ...current, [target.name]: "" }));
  };

  const applyCoupon = () => {
    toast("Mã giảm giá chưa được hỗ trợ trong phiên bản này.");
  };

  const updateDelivery = ({ target }) => {
    setDelivery((current) => ({ ...current, [target.name]: target.value }));
    setErrors((current) => ({ ...current, [target.name]: "" }));
  };

  const updateProvince = (province) => {
    setDelivery((current) => ({
      ...current,
      city: province?.name || "",
      cityCode: province ? String(province.code) : "",
      ward: "",
    }));
    setWards([]);
    setIsLoadingWards(Boolean(province));
    setErrors((current) => ({ ...current, city: "", ward: "" }));
  };

  const handleCustomerSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!customer.fullName.trim())
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    if (!customer.email.trim()) nextErrors.email = "Vui lòng nhập email.";
    else if (!/^\S+@\S+\.\S+$/.test(customer.email))
      nextErrors.email = "Email chưa đúng định dạng.";
    if (!customer.phone.trim())
      nextErrors.phone = "Vui lòng nhập số điện thoại.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Vui lòng kiểm tra lại thông tin giao hàng.");
      return;
    }

    localStorage.setItem(
      "checkout-info",
      JSON.stringify({ ...customer, ...delivery, paymentMethod, discount }),
    );
    setErrors({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeliverySubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!delivery.city.trim())
      nextErrors.city = "Vui lòng nhập tỉnh hoặc thành phố.";
    if (!delivery.ward.trim())
      nextErrors.ward = "Vui lòng chọn phường hoặc xã.";
    if (!delivery.address.trim())
      nextErrors.address = "Vui lòng nhập địa chỉ nhận hàng.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    localStorage.setItem(
      "checkout-info",
      JSON.stringify({ ...customer, ...delivery, paymentMethod, discount }),
    );

    setIsConfirmOpen(true);
  };

  const handleConfirmOrder = async () => {
    setIsPlacingOrder(true);
    localStorage.removeItem("current-order");
    localStorage.removeItem("current-payment");
    try {
      const checkoutKey = sessionStorage.getItem("checkout-idempotency-key") || crypto.randomUUID();
      sessionStorage.setItem("checkout-idempotency-key", checkoutKey);
      const orderResponse = await createOrder({
        customer: {
          fullName: customer.fullName.trim(),
          email: customer.email.trim(),
          phone: normalizePhone(customer.phone),
        },
        shippingAddress: {
          addressLine: delivery.address.trim(),
          ward: delivery.ward.trim(),
          province: delivery.city.trim(),
          note: delivery.note.trim(),
        },
      }, checkoutKey);
      const order = orderResponse.data.order;
      sessionStorage.removeItem("checkout-idempotency-key");
      localStorage.setItem("current-order", JSON.stringify(order));
      const paymentResponse = await createPayment(order.id || order._id);
      localStorage.setItem("current-payment", JSON.stringify(paymentResponse.data.payment));
      window.dispatchEvent(new Event("cart:updated"));
      setIsConfirmOpen(false);
      navigate("/payment");
    } catch (error) {
      toast.error(error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
      if (localStorage.getItem("current-order")) {
        setIsConfirmOpen(false);
        navigate("/payment");
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoadingCart) {
    return <main className="checkout-page"><div className="checkout-state" role="status"><ShieldCheck size={34} aria-hidden="true" /><h1>Đang tải giỏ hàng</h1></div></main>;
  }

  if (checkoutItems.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-state">
          <ShieldCheck size={34} aria-hidden="true" />
          <h1>Chưa có sản phẩm để thanh toán</h1>
          <p>Hãy quay lại cửa hàng và chọn sản phẩm bạn muốn mang về.</p>
          <Button variant="primary" onClick={() => navigate("/products")}>
            Khám phá sản phẩm
          </Button>
        </div>
      </main>
    );
  }

  if (checkoutItems.some((item) => !item.isAvailable)) {
    return <main className="checkout-page"><div className="checkout-state" role="alert"><ShoppingBag size={34} aria-hidden="true" /><h1>Giỏ hàng cần được cập nhật</h1><p>Có sản phẩm không còn khả dụng hoặc vượt quá tồn kho. Vui lòng kiểm tra lại số lượng.</p><Button variant="primary" onClick={() => navigate("/cart")}>Kiểm tra giỏ hàng</Button></div></main>;
  }

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <button
          className="checkout-back"
          type="button"
          onClick={() => navigate("/cart")}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Quay lại giỏ hàng
        </button>

        <header className="checkout-heading">
          <div>
            <p className="checkout-eyebrow">
              Bước {step} / 2 ·{" "}
              {step === 1 ? "Thông tin người nhận" : "Giao hàng & thanh toán"}
            </p>
            <h1>Xác nhận đơn hàng</h1>
          </div>
          <span className="checkout-step">
            Bước {step} <b>/</b> 2
          </span>
        </header>

        <div className="checkout-layout">
          <Card
            className={`checkout-form-card checkout-form-card--step-${step}`}
            title={
              step === 1
                ? "Thông tin người nhận"
                : "Địa chỉ giao hàng & thanh toán"
            }
          >
            {step === 1 ? (
              <>
                <p className="checkout-card-lede">
                  Nhập thông tin để Chạm Sắc Việt gửi sản phẩm đến bạn.
                </p>
                <p className="checkout-card-note">
                  Lưu ý: Hãy kiểm tra kỹ email và số điện thoại để nhận thông
                  tin đơn hàng.
                </p>
                <form
                  className="checkout-form"
                  onSubmit={handleCustomerSubmit}
                  noValidate
                >
                  <label className="checkout-field">
                    <span>Họ và tên</span>
                    <Input
                      name="fullName"
                      value={customer.fullName}
                      onChange={updateCustomer}
                      placeholder="Nhập họ và tên"
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    {errors.fullName && <small>{errors.fullName}</small>}
                  </label>
                  <label className="checkout-field">
                    <span>Email</span>
                    <Input
                      name="email"
                      type="email"
                      value={customer.email}
                      onChange={updateCustomer}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <small>{errors.email}</small>}
                  </label>
                  <label className="checkout-field">
                    <span>Số điện thoại</span>
                    <Input
                      name="phone"
                      type="tel"
                      value={customer.phone}
                      onChange={updateCustomer}
                      placeholder="Nhập số điện thoại"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && <small>{errors.phone}</small>}
                  </label>

                  <div className="checkout-coupon">
                    <div>
                      <h2>Mã giảm giá</h2>
                      <p>Nếu có, nhập mã ưu đãi của bạn.</p>
                    </div>
                    <div className="checkout-coupon__controls">
                      <Input
                        value={coupon}
                        onChange={(event) => setCoupon(event.target.value)}
                        placeholder="Nhập mã giảm giá"
                        aria-label="Mã giảm giá"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={applyCoupon}
                      >
                        Áp dụng
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="checkout-submit"
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight size={18} aria-hidden="true" />}
                    iconPosition="right"
                  >
                    Tiếp tục
                  </Button>
                </form>
              </>
            ) : (
              <>
                <p className="checkout-card-lede">
                  Nhập nơi nhận hàng và chọn cách thanh toán phù hợp.
                </p>
                <form
                  className="checkout-form checkout-form--delivery"
                  onSubmit={handleDeliverySubmit}
                  noValidate
                >
                  <div className="checkout-address-grid">
                    <label className="checkout-field">
                      <span>Tỉnh / thành phố</span>
                      <Autocomplete
                        className="checkout-autocomplete"
                        options={provinces}
                        value={
                          provinces.find(
                            (province) =>
                              String(province.code) === delivery.cityCode,
                          ) || null
                        }
                        onChange={(_, province) => updateProvince(province)}
                        getOptionLabel={(province) => province.name || ""}
                        isOptionEqualToValue={(option, value) =>
                          option.code === value.code
                        }
                        loading={isLoadingProvinces}
                        disabled={provinces.length === 0}
                        openOnFocus
                        autoHighlight
                        clearOnEscape
                        noOptionsText="Không tìm thấy tỉnh / thành phố"
                        loadingText="Đang tải danh sách…"
                        slotProps={{
                          paper: { className: "checkout-location-paper" },
                          listbox: { className: "checkout-location-listbox" },
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Gõ để tìm tỉnh / thành phố"
                            error={Boolean(errors.city)}
                          />
                        )}
                      />
                      {errors.city && <small>{errors.city}</small>}
                    </label>
                    <label className="checkout-field">
                      <span>Phường / xã</span>
                      <Autocomplete
                        className="checkout-autocomplete"
                        options={wards}
                        value={
                          wards.find((ward) => ward.name === delivery.ward) ||
                          null
                        }
                        onChange={(_, ward) => {
                          setDelivery((current) => ({
                            ...current,
                            ward: ward?.name || "",
                          }));
                          setErrors((current) => ({ ...current, ward: "" }));
                        }}
                        getOptionLabel={(ward) => ward.name || ""}
                        isOptionEqualToValue={(option, value) =>
                          option.code === value.code
                        }
                        loading={isLoadingWards}
                        disabled={
                          !delivery.cityCode ||
                          isLoadingWards ||
                          wards.length === 0
                        }
                        openOnFocus
                        autoHighlight
                        clearOnEscape
                        noOptionsText="Không tìm thấy phường / xã"
                        loadingText="Đang tải danh sách…"
                        slotProps={{
                          paper: { className: "checkout-location-paper" },
                          listbox: { className: "checkout-location-listbox" },
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={
                              delivery.cityCode
                                ? "Gõ để tìm phường / xã"
                                : "Chọn tỉnh / thành phố trước"
                            }
                            error={Boolean(errors.ward)}
                          />
                        )}
                      />
                      {errors.ward && <small>{errors.ward}</small>}
                    </label>
                  </div>
                  {locationError && (
                    <p className="checkout-location-error" role="status">
                      {locationError}
                    </p>
                  )}
                  <label className="checkout-field">
                    <span>Địa chỉ cụ thể</span>
                    <Input
                      name="address"
                      value={delivery.address}
                      onChange={updateDelivery}
                      placeholder="Số nhà, tên đường"
                      aria-invalid={Boolean(errors.address)}
                    />
                    {errors.address && <small>{errors.address}</small>}
                  </label>
                  <label className="checkout-field">
                    <span>
                      Ghi chú giao hàng <em>(không bắt buộc)</em>
                    </span>
                    <textarea
                      className="checkout-textarea"
                      name="note"
                      value={delivery.note}
                      onChange={updateDelivery}
                      placeholder="Lưu ý cho người giao hàng"
                      rows={3}
                    />
                  </label>

                  <fieldset className="checkout-payment-options">
                    <legend>Phương thức thanh toán</legend>
                    <label
                      className={`checkout-payment-option${paymentMethod === "cod" ? " is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        disabled
                        onChange={() => setPaymentMethod("cod")}
                      />
                      <span className="checkout-payment-option__icon">
                        <Banknote size={20} aria-hidden="true" />
                      </span>
                      <span className="checkout-payment-option__copy">
                        <strong>Thanh toán khi nhận hàng</strong>
                        <small>
                          Chưa hỗ trợ trong phiên bản hiện tại.
                        </small>
                      </span>
                      <span
                        className="checkout-payment-option__indicator"
                        aria-hidden="true"
                      />
                    </label>
                    <label
                      className={`checkout-payment-option${paymentMethod === "bank" ? " is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === "bank"}
                        onChange={() => setPaymentMethod("bank")}
                      />
                      <span className="checkout-payment-option__icon">
                        <CreditCard size={20} aria-hidden="true" />
                      </span>
                      <span className="checkout-payment-option__copy">
                        <strong>Chuyển khoản ngân hàng</strong>
                        <small>
                          Thông tin chuyển khoản sẽ hiển thị sau khi xác nhận.
                        </small>
                      </span>
                      <span
                        className="checkout-payment-option__indicator"
                        aria-hidden="true"
                      />
                    </label>
                  </fieldset>

                  <div className="checkout-step-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={<ArrowLeft size={17} aria-hidden="true" />}
                      onClick={() => setStep(1)}
                    >
                      Quay lại
                    </Button>
                    <Button
                      className="checkout-submit"
                      type="submit"
                      variant="primary"
                      size="lg"
                      icon={<Check size={18} aria-hidden="true" />}
                      iconPosition="right"
                      loading={isPlacingOrder}
                    >
                      Xác nhận đặt hàng
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>

          <Card
            className="checkout-summary"
            title={`Sản phẩm đã chọn · ${checkoutItems.length}`}
          >
            <div className="checkout-summary__items">
              {checkoutItems.map((item) => {
                return (
                  <article
                    className="checkout-summary__item"
                    key={item.productId}
                  >
                    <div
                      className="checkout-summary__visual checkout-summary__visual--yellow"
                    >
                      {item.image ? <img src={item.image} alt={item.productName} /> : <ShoppingBag size={28} aria-hidden="true" />}
                    </div>
                    <div className="checkout-summary__item-copy">
                      <p>{item.category}</p>
                      <h2>{item.productName}</h2>
                      <span>
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </span>
                    </div>
                    <strong>
                      {formatMoney(
                        Number(item.unitPrice || 0) *
                          Number(item.quantity || 0),
                      )}
                    </strong>
                  </article>
                );
              })}
            </div>
            <div className="checkout-summary__row">
              <span>Tạm tính</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <div className="checkout-summary__row">
              <span>Giảm giá</span>
              <strong>{discount ? `- ${formatMoney(discount)}` : "—"}</strong>
            </div>
            <div className="checkout-summary__total">
              <span>Tổng cộng</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            <p className="checkout-summary__safe">
              <Check size={15} aria-hidden="true" /> Thông tin của bạn được lưu
              an toàn trong phiên này.
            </p>
          </Card>
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmOrder}
        title="Xác nhận đặt hàng?"
        description="Thông tin giao hàng và phương thức thanh toán đã được lưu. Xác nhận để tiếp tục đến bước thanh toán."
        cancelLabel="Kiểm tra lại"
        confirmLabel="Xác nhận"
        isLoading={isPlacingOrder}
      />
    </main>
  );
}

export default CheckOutPage;
