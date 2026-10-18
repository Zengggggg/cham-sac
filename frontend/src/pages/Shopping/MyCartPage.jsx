import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import starElement from "../../assets/elements/IMG_4811.PNG";
import diceElement from "../../assets/elements/IMG_4818.PNG";
import diceLightElement from "../../assets/elements/IMG_4819.PNG";
import redElement from "../../assets/elements/IMG_4820.PNG";
import "./MyCartPage.scss";

const productCatalog = {
  "boardgame-cham-sac-viet": { category: "Boardgame", tone: "purple", image: diceElement },
  "bo-the-di-san": { category: "Thẻ trải nghiệm", tone: "teal", image: diceLightElement },
  "so-tay-hanh-trinh": { category: "Quà lưu niệm", tone: "yellow", image: starElement },
  "combo-kham-pha": { category: "Boardgame", tone: "red", image: diceElement },
};

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)}đ`;

const readCart = () => {
  try {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(storedCart) ? storedCart : [];
  } catch {
    return [];
  }
};

function MyCartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(readCart);
  const [selectedIds, setSelectedIds] = useState(() =>
    readCart().map((item) => item.productId),
  );

  useEffect(() => {
    const syncCart = () => {
      const nextCart = readCart();
      setCartItems(nextCart);
      setSelectedIds((currentIds) =>
        currentIds.filter((id) => nextCart.some((item) => item.productId === id)),
      );
    };

    window.addEventListener("cart:updated", syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener("cart:updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

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

  const persistCart = (nextCart) => {
    setCartItems(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
    window.dispatchEvent(new Event("cart:updated"));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : cartItems.map((item) => item.productId));
  };

  const toggleItem = (productId) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId],
    );
  };

  const updateQuantity = (productId, nextQuantity) => {
    const safeQuantity = Math.max(1, Math.min(25, nextQuantity));
    persistCart(cartItems.map((item) =>
      item.productId === productId ? { ...item, quantity: safeQuantity } : item,
    ));
  };

  const removeItem = (productId) => {
    persistCart(cartItems.filter((item) => item.productId !== productId));
    setSelectedIds((currentIds) => currentIds.filter((id) => id !== productId));
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
  };

  const removeAll = () => {
    persistCart([]);
    setSelectedIds([]);
    toast.success("Đã làm trống giỏ hàng.");
  };

  const continueToCheckout = () => {
    localStorage.setItem("selected-cart-items", JSON.stringify(selectedIds));
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

        {cartItems.length === 0 ? (
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
                        <img src={meta.image} alt="" aria-hidden="true" />
                      </div>
                      <div className="shopping-cart-item__content">
                        <div className="shopping-cart-item__heading">
                          <div><p>{meta.category}</p><h2>{item.productName}</h2></div>
                          <button className="shopping-cart-item__remove" type="button" aria-label={`Xóa ${item.productName}`} onClick={() => removeItem(item.productId)}>
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                        <p className="shopping-cart-item__stock">Còn lại: 25 sản phẩm</p>
                        <div className="shopping-cart-item__footer">
                          <div className="shopping-cart-quantity" aria-label="Số lượng sản phẩm">
                            <button type="button" aria-label="Giảm số lượng" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus size={15} aria-hidden="true" /></button>
                            <output aria-live="polite">{item.quantity}</output>
                            <button type="button" aria-label="Tăng số lượng" disabled={item.quantity >= 25} onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus size={15} aria-hidden="true" /></button>
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
