import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import starElement from "../../assets/elements/IMG_4811.PNG";
import diceElement from "../../assets/elements/IMG_4818.PNG";
import diceLightElement from "../../assets/elements/IMG_4819.PNG";
import redElement from "../../assets/elements/IMG_4820.PNG";
import { getAccessToken } from "../../services/apiClient.js";
import { getCart, removeCartItem, updateCartItem } from "../../services/shopService.js";
import "./MyCartPage.scss";

const productCatalog = {
  "boardgame-cham-sac-viet": { category: "Boardgame", tone: "purple", image: diceElement },
  "bo-the-di-san": { category: "Thẻ trải nghiệm", tone: "teal", image: diceLightElement },
  "so-tay-hanh-trinh": { category: "Quà lưu niệm", tone: "yellow", image: starElement },
  "combo-kham-pha": { category: "Boardgame", tone: "red", image: diceElement },
};

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)}đ`;

const normalizeCart = (cart) => (cart?.items || []).map((item) => ({
  ...item,
  productName: item.product?.name || "Sản phẩm",
  unitPrice: item.product?.price || 0,
  stock: item.product?.stock || 0,
  image: item.product?.images?.[0] || "",
}));

function MyCartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const applyCart = useCallback((cart) => {
    const items = normalizeCart(cart);
    setCartItems(items);
    setSelectedIds(items.filter((item) => item.selected).map((item) => item.productId));
  }, []);

  const loadCart = useCallback(async () => {
    if (!getAccessToken()) {
      setIsLoading(false);
      setError("Vui lòng đăng nhập để xem giỏ hàng.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await getCart();
      applyCart(response.data.cart);
    } catch (requestError) {
      setError(requestError.message || "Không thể tải giỏ hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [applyCart]);

  useEffect(() => {
    const syncCart = () => { void loadCart(); };

    const timeoutId = window.setTimeout(syncCart, 0);

    window.addEventListener("cart:updated", syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener("cart:updated", syncCart);
      window.removeEventListener("storage", syncCart);
      window.clearTimeout(timeoutId);
    };
  }, [loadCart]);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedIds.includes(item.productId)),
    [cartItems, selectedIds],
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

  const toggleAll = async () => {
    const selected = !allSelected;
    try {
      await Promise.all(cartItems.map((item) => updateCartItem(item.productId, { selected })));
      await loadCart();
    } catch (requestError) {
      toast.error(requestError.message || "Không thể cập nhật giỏ hàng.");
    }
  };

  const toggleItem = async (productId) => {
    try {
      const response = await updateCartItem(productId, { selected: !selectedIds.includes(productId) });
      applyCart(response.data.cart);
    } catch (requestError) {
      toast.error(requestError.message || "Không thể cập nhật giỏ hàng.");
    }
  };

  const updateQuantity = async (productId, nextQuantity) => {
    const item = cartItems.find((entry) => entry.productId === productId);
    const safeQuantity = Math.max(1, Math.min(item?.stock || 1, nextQuantity));
    try {
      const response = await updateCartItem(productId, { quantity: safeQuantity });
      applyCart(response.data.cart);
    } catch (requestError) {
      toast.error(requestError.message || "Không thể cập nhật số lượng.");
    }
  };

  const removeItem = async (productId) => {
    try {
      const response = await removeCartItem(productId);
      applyCart(response.data.cart);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
    } catch (requestError) {
      toast.error(requestError.message || "Không thể xóa sản phẩm.");
    }
  };

  const removeAll = async () => {
    try {
      await Promise.all(cartItems.map((item) => removeCartItem(item.productId)));
      applyCart({ items: [] });
      toast.success("Đã làm trống giỏ hàng.");
    } catch (requestError) {
      toast.error(requestError.message || "Không thể làm trống giỏ hàng.");
      await loadCart();
    }
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
          <Card className="shopping-cart-empty" role="status"><h2>Đang tải giỏ hàng</h2></Card>
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
            <Card className="shopping-cart-items" aria-label="Danh sách sản phẩm trong giỏ hàng">
              <div className="shopping-cart-items__top">
                <label className="shopping-cart-select-all">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  <span>Chọn tất cả ({selectedItems.length}/{cartItems.length})</span>
                </label>
                <button type="button" onClick={removeAll}>Xóa tất cả</button>
              </div>

              <div className="shopping-cart-items__list">
                {cartItems.map((item) => {
                  const meta = productCatalog[item.productId] || {
                    category: "Sản phẩm Chạm Sắc Việt", tone: "yellow", image: redElement,
                  };
                  const subtotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);

                  return (
                    <article className="shopping-cart-item" key={item.productId}>
                      <label className="shopping-cart-item__checkbox">
                        <input type="checkbox" checked={selectedIds.includes(item.productId)} onChange={() => toggleItem(item.productId)} aria-label={`Chọn ${item.productName}`} />
                      </label>
                      <div className={`shopping-cart-item__visual shopping-cart-item__visual--${meta.tone}`}>
                        <img src={item.image || meta.image} alt="" aria-hidden="true" />
                      </div>
                      <div className="shopping-cart-item__content">
                        <div className="shopping-cart-item__heading">
                          <div><p>{meta.category}</p><h2>{item.productName}</h2></div>
                          <button className="shopping-cart-item__remove" type="button" aria-label={`Xóa ${item.productName}`} onClick={() => removeItem(item.productId)}>
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                        <p className="shopping-cart-item__stock">Còn lại: {item.stock} sản phẩm</p>
                        <div className="shopping-cart-item__footer">
                          <div className="shopping-cart-quantity" aria-label="Số lượng sản phẩm">
                            <button type="button" aria-label="Giảm số lượng" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus size={15} aria-hidden="true" /></button>
                            <output aria-live="polite">{item.quantity}</output>
                            <button type="button" aria-label="Tăng số lượng" disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus size={15} aria-hidden="true" /></button>
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
              <Button className="shopping-cart-summary__checkout" variant="primary" size="lg" disabled={selectedItems.length === 0} onClick={continueToCheckout}>Tiếp tục thanh toán</Button>
              {selectedItems.length === 0 && <p className="shopping-cart-summary__warning">Hãy chọn ít nhất một sản phẩm để tiếp tục.</p>}
              <p className="shopping-cart-summary__note">Bạn có thể kiểm tra lại sản phẩm trong giỏ trước khi thanh toán.</p>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

export default MyCartPage;
