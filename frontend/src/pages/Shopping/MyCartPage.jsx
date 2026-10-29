import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";
import productFallback from "../../assets/product.png";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { getAccessToken, getStoredUser } from "../../services/apiClient.js";
import { getCart, removeCartItem, updateCartItem } from "../../services/shopService.js";
import { normalizeCartItems } from "../../utils/cart.js";
import "./MyCartPage.scss";

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)}đ`;

const getCartOwner = () => {
  const user = getStoredUser();
  return user?.id || user?._id || null;
};

function CartSkeleton() {
  return (
    <div className="shopping-cart-layout shopping-cart-layout--skeleton" aria-label="Đang tải giỏ hàng" role="status">
      <Card className="shopping-cart-items shopping-cart-items--skeleton">
        <div className="shopping-cart-items__top">
          <Skeleton width={150} height={16} />
          <Skeleton width={82} height={16} />
        </div>
        <div className="shopping-cart-items__list">
          {Array.from({ length: 2 }, (_, index) => (
            <article className="shopping-cart-item" key={index}>
              <Skeleton className="shopping-cart-skeleton-checkbox" width={17} height={17} />
              <Skeleton className="shopping-cart-skeleton-image" width={112} height={112} />
              <div className="shopping-cart-item__content">
                <div className="shopping-cart-item__heading">
                  <div className="shopping-cart-skeleton-copy">
                    <Skeleton width="34%" height={12} />
                    <Skeleton width="72%" height={27} />
                  </div>
                  <Skeleton width={34} height={34} borderRadius={8} />
                </div>
                <Skeleton width="46%" height={13} />
                <div className="shopping-cart-item__footer">
                  <Skeleton width={108} height={36} borderRadius={8} />
                  <Skeleton width={92} height={24} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>
      <Card className="shopping-cart-summary shopping-cart-summary--skeleton">
        <Skeleton width="48%" height={28} />
        <Skeleton className="shopping-cart-skeleton-summary-line" count={3} height={18} />
        <Skeleton className="shopping-cart-skeleton-summary-total" height={30} />
        <Skeleton height={48} borderRadius={8} />
      </Card>
    </div>
  );
}

function MyCartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const mutationPending = useRef(false);
  const loadVersion = useRef(0);

  const applyCart = useCallback((cart) => {
    setCartItems(normalizeCartItems(cart));
  }, []);

  const loadCart = useCallback(async () => {
    const version = ++loadVersion.current;
    const owner = getCartOwner();
    if (!getAccessToken()) {
      setCartItems([]);
      setIsLoading(false);
      setError("Vui lòng đăng nhập để xem giỏ hàng.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await getCart();
      if (version === loadVersion.current && owner === getCartOwner()) applyCart(response.data.cart);
    } catch (requestError) {
      if (version === loadVersion.current) setError(requestError.message || "Không thể tải giỏ hàng.");
    } finally {
      if (version === loadVersion.current) setIsLoading(false);
    }
  }, [applyCart]);

  useEffect(() => {
    const syncCart = () => { void loadCart(); };

    const timeoutId = window.setTimeout(syncCart, 0);

    window.addEventListener("cart:updated", syncCart);
    window.addEventListener("storage", syncCart);
    window.addEventListener("auth:login", syncCart);
    window.addEventListener("auth:logout", syncCart);
    return () => {
      loadVersion.current += 1;
      window.removeEventListener("cart:updated", syncCart);
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("auth:login", syncCart);
      window.removeEventListener("auth:logout", syncCart);
      window.clearTimeout(timeoutId);
    };
  }, [loadCart]);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => item.selected),
    [cartItems],
  );
  const selectedTotal = useMemo(
    () => selectedItems.reduce(
      (total, item) => total + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0,
    ),
    [selectedItems],
  );
  const totalQuantity = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );
  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;
  const hasUnavailableSelection = selectedItems.some((item) => !item.isAvailable);

  const mutateCart = async (action, errorMessage, successMessage) => {
    if (mutationPending.current) return;
    mutationPending.current = true;
    loadVersion.current += 1;
    const owner = getCartOwner();
    setIsUpdating(true);
    try {
      const response = await action();
      if (owner !== getCartOwner() || !getAccessToken()) return;
      applyCart(response.data.cart);
      if (successMessage) toast.success(successMessage);
    } catch (requestError) {
      toast.error(requestError.message || errorMessage);
      await loadCart();
    } finally {
      mutationPending.current = false;
      setIsUpdating(false);
    }
  };

  const toggleAll = async () => {
    const selected = !allSelected;
    await mutateCart(async () => {
      let response;
      for (const item of cartItems) {
        if (item.selected !== selected) response = await updateCartItem(item.productId, { selected });
      }
      return response || getCart();
    }, "Không thể cập nhật giỏ hàng.");
  };

  const toggleItem = async (productId) => {
    const item = cartItems.find((entry) => entry.productId === productId);
    await mutateCart(() => updateCartItem(productId, { selected: !item.selected }), "Không thể cập nhật giỏ hàng.");
  };

  const updateQuantity = async (productId, nextQuantity) => {
    const item = cartItems.find((entry) => entry.productId === productId);
    if (!item?.product || item.product.status !== "active" || item.stock < 1) return;
    const safeQuantity = Math.max(1, Math.min(item.stock, nextQuantity));
    if (safeQuantity === item.quantity) return;
    await mutateCart(() => updateCartItem(productId, { quantity: safeQuantity }), "Không thể cập nhật số lượng.");
  };

  const removeItem = async (productId) => {
    await mutateCart(() => removeCartItem(productId), "Không thể xóa sản phẩm.", "Đã xóa sản phẩm khỏi giỏ hàng.");
  };

  const removeAll = async () => {
    await mutateCart(async () => {
      let response;
      for (const item of cartItems) response = await removeCartItem(item.productId);
      return response;
    }, "Không thể làm trống giỏ hàng.", "Đã làm trống giỏ hàng.");
  };

  const continueToCheckout = () => {
    navigate("/checkout");
  };

  return (
    <main className="shopping-cart-page">
      <div className="shopping-cart-shell">
        <button className="shopping-cart-back" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Quay lại sản phẩm
        </button>

        <header className="shopping-cart-heading">
          <div>
            <h1>Giỏ hàng của bạn</h1>
          </div>
          {cartItems.length > 0 && (
            <span className="shopping-cart-count">{totalQuantity} sản phẩm trong giỏ hàng</span>
          )}
        </header>

        {isLoading ? (
          <CartSkeleton />
        ) : error ? (
          <Card className="shopping-cart-empty" role="alert"><h2>Không thể mở giỏ hàng</h2><p>{error}</p><Button variant="primary" onClick={() => getAccessToken() ? loadCart() : navigate("/login")}>{getAccessToken() ? "Thử lại" : "Đăng nhập"}</Button></Card>
        ) : cartItems.length === 0 ? (
          <Card className="shopping-cart-empty">
            <span className="shopping-cart-empty__icon"><ShoppingBag size={28} aria-hidden="true" /></span>
            <h2>Giỏ hàng đang trống</h2>
            <p>Chọn một sản phẩm để bắt đầu mang câu chuyện Việt về gần hơn.</p>
            <Button variant="primary" onClick={() => navigate("/products")}>Khám phá sản phẩm</Button>
          </Card>
        ) : (
          <div className="shopping-cart-layout">
            <Card className="shopping-cart-items" aria-label="Danh sách sản phẩm trong giỏ hàng" aria-busy={isUpdating}>
              <div className="shopping-cart-items__top">
                <label className="shopping-cart-select-all">
                  <input type="checkbox" checked={allSelected} disabled={isUpdating} onChange={toggleAll} />
                  <span>Chọn tất cả ({selectedItems.length}/{cartItems.length})</span>
                </label>
                <button type="button" disabled={isUpdating} onClick={removeAll}>Xóa tất cả</button>
              </div>

              <div className="shopping-cart-items__list">
                {cartItems.map((item) => {
                  const subtotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);

                  return (
                    <article className="shopping-cart-item" key={item.productId}>
                      <label className="shopping-cart-item__checkbox">
                        <input type="checkbox" checked={item.selected} disabled={isUpdating} onChange={() => toggleItem(item.productId)} aria-label={`Chọn ${item.productName}`} />
                      </label>
                      <div className="shopping-cart-item__visual shopping-cart-item__visual--yellow">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = productFallback;
                            }}
                          />
                        ) : <ShoppingBag size={32} aria-hidden="true" />}
                      </div>
                      <div className="shopping-cart-item__content">
                        <div className="shopping-cart-item__heading">
                          <div><p>{item.category}</p><h2>{item.productName}</h2></div>
                          <button className="shopping-cart-item__remove" type="button" disabled={isUpdating} aria-label={`Xóa ${item.productName}`} onClick={() => removeItem(item.productId)}>
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                        <p className="shopping-cart-item__stock">Còn lại: {item.stock} sản phẩm</p>
                        {!item.isAvailable && <p className="shopping-cart-summary__warning" role="status">Sản phẩm không còn đủ điều kiện thanh toán. Vui lòng bỏ chọn hoặc xóa khỏi giỏ.</p>}
                        <div className="shopping-cart-item__footer">
                          <div className="shopping-cart-quantity" aria-label="Số lượng sản phẩm">
                            <button type="button" aria-label="Giảm số lượng" disabled={isUpdating || item.product?.status !== "active" || item.stock < 1 || item.quantity <= 1} onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus size={15} aria-hidden="true" /></button>
                            <output aria-live="polite">{item.quantity}</output>
                            <button type="button" aria-label="Tăng số lượng" disabled={isUpdating || !item.isAvailable || item.quantity >= item.stock} onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus size={15} aria-hidden="true" /></button>
                          </div>
                          <strong>{formatMoney(subtotal)}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>

            <Card className="shopping-cart-summary" title="Tóm tắt đơn hàng">
              <div className="shopping-cart-summary__row"><span>Tạm tính ({selectedItems.length} sản phẩm)</span><strong>{formatMoney(selectedTotal)}</strong></div>
              <div className="shopping-cart-summary__row"><span>Phí vận chuyển</span><strong>Miễn phí</strong></div>
              <div className="shopping-cart-summary__total"><span>Tổng cộng</span><strong>{formatMoney(selectedTotal)}</strong></div>
              <Button className="shopping-cart-summary__checkout" variant="primary" size="lg" disabled={isUpdating || selectedItems.length === 0 || hasUnavailableSelection} onClick={continueToCheckout}>Tiếp tục thanh toán</Button>
              {selectedItems.length === 0 && <p className="shopping-cart-summary__warning">Hãy chọn ít nhất một sản phẩm để tiếp tục.</p>}
              {hasUnavailableSelection && <p className="shopping-cart-summary__warning">Bỏ chọn sản phẩm không khả dụng để tiếp tục thanh toán.</p>}
              <p className="shopping-cart-summary__note">Bạn có thể kiểm tra lại sản phẩm trong giỏ trước khi thanh toán.</p>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

export default MyCartPage;
