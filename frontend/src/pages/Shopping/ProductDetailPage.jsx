import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Gift,
  HeartHandshake,
  MapPinned,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import starElement from "../../assets/elements/IMG_4811.PNG";
import diceElement from "../../assets/elements/IMG_4818.PNG";
import diceLightElement from "../../assets/elements/IMG_4819.PNG";
import elementFour from "../../assets/elements/IMG_4820.PNG";
import elementFive from "../../assets/elements/IMG_4821.PNG";
import { getAccessToken, getStoredUser } from "../../services/apiClient.js";
import { addCartItem, getCart, getProduct } from "../../services/shopService.js";
import { getCartProduct, getCartQuantity } from "../../utils/cart.js";
import "./ProductDetailPage.scss";

const features = [
  {
    icon: MapPinned,
    title: "Chạm vào địa phương",
    text: "Mỗi sản phẩm bắt đầu từ một chất liệu, địa danh hoặc câu chuyện Việt.",
  },
  {
    icon: HeartHandshake,
    title: "Chơi cùng nhau",
    text: "Thiết kế để mở ra một cuộc trò chuyện giữa gia đình, bạn bè và cộng đồng.",
  },
  {
    icon: Gift,
    title: "Mang câu chuyện về",
    text: "Một món quà nhỏ để tiếp tục hành trình khám phá sau khi rời trải nghiệm.",
  },
];

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

const getCartOwner = () => {
  const user = getStoredUser();
  return user?.id || user?._id || null;
};

const isVideoSource = (source) => /\.mp4(?:$|[?#])/i.test(source || "");

function ProductDetailSkeleton() {
  return (
    <main className="product-detail-page product-detail-page--loading" role="status" aria-label="Đang tải sản phẩm">
      <div className="product-detail-shell">
        <Skeleton width={150} height={18} />
        <div className="product-detail-layout" aria-hidden="true">
          <section className="product-detail-main">
            <Skeleton width="28%" height={13} />
            <Skeleton className="product-detail-skeleton-title" width="76%" height={76} />
            <Skeleton className="product-detail-skeleton-lede" count={2} height={16} />
            <Skeleton className="product-detail-skeleton-rating" width="58%" height={16} />
            <div className="product-detail-gallery product-detail-gallery--skeleton">
              <div className="product-detail-thumbnails">
                {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} />)}
              </div>
              <Skeleton className="product-detail-skeleton-visual" />
            </div>
          </section>
          <aside className="product-detail-purchase-column">
            <Card className="product-detail-purchase product-detail-purchase--skeleton">
              <Skeleton width="34%" height={14} />
              <Skeleton className="product-detail-skeleton-price" width="58%" height={42} />
              <Skeleton className="product-detail-skeleton-row" count={3} height={20} />
              <Skeleton className="product-detail-skeleton-button" height={52} />
              <Skeleton width="80%" height={12} />
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ProductDescription({ description }) {
  const lines = (description || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const detailLines = lines.filter((line) => line.startsWith("•"));
  const introLines = lines.filter((line) => !line.startsWith("•"));

  return (
    <div className="product-detail-description">
      {introLines.map((line, index) => <p key={`intro-${index}`}>{line}</p>)}
      {detailLines.length > 0 && (
        <div className="product-detail-description__table" role="list" aria-label="Thông tin chi tiết sản phẩm">
          {detailLines.map((line, index) => {
            const [label, ...valueParts] = line.slice(1).trim().split(":");
            return (
              <div className="product-detail-description__row" role="listitem" key={`detail-${index}`}>
                <strong>{label.trim()}</strong>
                <span>{valueParts.join(":").trim()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [productData, setProductData] = useState(null);
  const [loadedProductId, setLoadedProductId] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const product = productData ? {
    tone: "purple",
    ...productData,
    id: productData.id || productData._id,
    image: productData.images?.[0] || diceElement,
    detail: productData.description,
    tag: productData.canPurchase ? "Đang mở bán" : "Tạm hết hàng",
  } : null;
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const addPending = useRef(false);
  const activeProductId = useRef(null);
  const [selectedImages, setSelectedImages] = useState({});
  const selectedImage = selectedImages[productId] || product?.image;
  const availableToAdd = Math.max(0, (product?.stock || 0) - cartQuantity);

  useEffect(() => {
    activeProductId.current = productId;
    let active = true;
    let requestVersion = 0;
    const loadProduct = () => {
      const version = ++requestVersion;
      const owner = getCartOwner();
      setIsLoading(true);
      setLoadError("");
      setQuantity(1);
      return Promise.all([
        getProduct(productId),
        getAccessToken() ? getCart().catch(() => null) : Promise.resolve(null),
      ])
      .then(([response, cartResponse]) => {
        if (active && version === requestVersion && owner === getCartOwner()) {
          setProductData(response.data.product);
          setCartQuantity(getCartQuantity(cartResponse?.data?.cart, productId));
        }
      })
      .catch((error) => {
        if (active && version === requestVersion) setLoadError(error.message || "Không thể tải sản phẩm.");
      })
      .finally(() => {
        if (active && version === requestVersion) {
          setIsLoading(false);
          setLoadedProductId(productId);
        }
      });
    };
    const timeoutId = window.setTimeout(loadProduct, 0);
    window.addEventListener("auth:login", loadProduct);
    window.addEventListener("auth:logout", loadProduct);
    return () => {
      active = false;
      activeProductId.current = null;
      window.clearTimeout(timeoutId);
      window.removeEventListener("auth:login", loadProduct);
      window.removeEventListener("auth:logout", loadProduct);
    };
  }, [productId]);

  const addToCart = async () => {
    if (!product || addPending.current || !product.canPurchase || availableToAdd < 1) return;
    if (!getAccessToken()) {
      toast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login", { state: { from: `/products/${productId}` } });
      return;
    }

    addPending.current = true;
    const owner = getCartOwner();
    const isCurrentProduct = () => activeProductId.current === product.id
      && owner === getCartOwner() && Boolean(getAccessToken());
    setIsAddingToCart(true);
    try {
      const response = await addCartItem(product.id, quantity);
      window.dispatchEvent(new Event("cart:updated"));
      if (!isCurrentProduct()) return;
      const updatedProduct = getCartProduct(response.data.cart, product.id);
      const nextCartQuantity = getCartQuantity(response.data.cart, product.id);
      if (updatedProduct) {
        setProductData((current) => (current?.id || current?._id) === product.id ? ({
          ...current,
          ...updatedProduct,
          canPurchase: updatedProduct.status === "active" && updatedProduct.stock > 0,
        }) : current);
        setCartQuantity(nextCartQuantity);
        setQuantity((current) => Math.max(1, Math.min(current, updatedProduct.stock - nextCartQuantity)));
      }
      toast.success(`Đã thêm “${product.name}” vào giỏ hàng`);
    } catch (error) {
      if (!isCurrentProduct()) return;
      toast.error(error.message || "Không thể cập nhật giỏ hàng lúc này.");
      if (error.statusCode === 409) {
        await Promise.all([getProduct(product.id), getCart()]).then(([productResponse, cartResponse]) => {
          if (!isCurrentProduct()) return;
          const nextCartQuantity = getCartQuantity(cartResponse.data.cart, product.id);
          setProductData(productResponse.data.product);
          setCartQuantity(nextCartQuantity);
          setQuantity((current) => Math.max(1, Math.min(current, productResponse.data.product.stock - nextCartQuantity)));
        }).catch(() => undefined);
      }
    } finally {
      addPending.current = false;
      setIsAddingToCart(false);
    }
  };

  if (isLoading || loadedProductId !== productId) {
    return <ProductDetailSkeleton />;
  }

  if (!product || loadError) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-state">
          <Sparkles size={30} aria-hidden="true" />
          <h1>Không tìm thấy sản phẩm</h1>
          <p>{loadError || "Sản phẩm này có thể đã được thay đổi hoặc không còn tồn tại."}</p>
          <Button as={Link} to="/products" variant="primary">
            Xem sản phẩm
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <img
        className="product-detail-page__element product-detail-page__element--star"
        src={starElement}
        alt=""
        aria-hidden="true"
      />
      <div className="product-detail-shell">
        <button
          className="product-detail-back"
          type="button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Quay lại sản phẩm
        </button>

        <div className="product-detail-layout">
          <section className="product-detail-main" aria-labelledby="product-detail-title">
            <p className="product-detail-eyebrow">
              <Sparkles size={15} aria-hidden="true" /> Khám phá sản phẩm
            </p>
            <h1 id="product-detail-title">{product.name}</h1>
            <div className="product-detail-rating" aria-label="Được đánh giá 4.9 trên 5">
              <Star size={17} fill="currentColor" aria-hidden="true" />
              <strong>4.9</strong>
              <span>Được yêu thích bởi cộng đồng khám phá di sản</span>
            </div>
            <div className="product-detail-gallery">
              <div className="product-detail-thumbnails" aria-label="Ảnh sản phẩm">
                {(product.images?.length ? product.images : [product.image])
                  .filter(Boolean)
                  .filter((image, index, images) => images.indexOf(image) === index)
                  .slice(0, 5)
                  .map((image, index) => (
                    <button
                      className={`product-detail-thumbnail${selectedImage === image ? " is-active" : ""}`}
                      type="button"
                      key={image}
                      aria-label={`Xem ảnh sản phẩm ${index + 1}`}
                      aria-pressed={selectedImage === image}
                      onClick={() =>
                        setSelectedImages((current) => ({
                          ...current,
                          [productId]: image,
                        }))
                      }
                    >
                      {isVideoSource(image) ? (
                        <video src={image} autoPlay muted loop playsInline aria-hidden="true" />
                      ) : (
                        <img src={image} alt="" aria-hidden="true" />
                      )}
                    </button>
                  ))}
              </div>
              <div className={`product-detail-visual product-detail-visual--${product.tone}`}>
                <span className="product-detail-tag">{product.tag}</span>
                {isVideoSource(selectedImage || product.image) ? (
                  <video
                    src={selectedImage || product.image}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    aria-label={`Video minh họa ${product.name}`}
                  />
                ) : (
                  <img src={selectedImage || product.image} alt={`Hình minh họa ${product.name}`} />
                )}
                <span className="product-detail-visual__label">CHẠM SẮC VIỆT</span>
              </div>
            </div>
            <p className="product-detail-caption">
              Một vật phẩm nhỏ, một câu chuyện có thể mang theo.
            </p>
          </section>

          <aside className="product-detail-purchase-column">
            <Card className="product-detail-purchase" aria-label="Thêm sản phẩm vào giỏ hàng">
              <div className="product-detail-status">
                <span aria-hidden="true" /> {product.canPurchase ? "Đang mở bán" : "Tạm hết hàng"}
              </div>
              <div className="product-detail-price-row">
                <span>Giá sản phẩm</span>
                <strong>{formatMoney(product.price)}</strong>
              </div>
              <div className="product-detail-stock">
                <span>Còn lại</span>
                <strong>{product.stock}</strong>
              </div>
              {cartQuantity > 0 && <div className="product-detail-stock"><span>Đã có {cartQuantity} trong giỏ</span><strong>Có thể thêm {availableToAdd}</strong></div>}
              <div className="product-detail-quantity-row">
                <label htmlFor="product-quantity">Số lượng</label>
                <div className="product-detail-quantity">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    disabled={quantity <= 1 || isAddingToCart}
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <output id="product-quantity" aria-live="polite">{quantity}</output>
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    disabled={quantity >= availableToAdd || isAddingToCart}
                    onClick={() => setQuantity((value) => Math.min(availableToAdd, value + 1))}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="product-detail-total">
                <span>Tạm tính</span>
                <strong>{formatMoney(product.price * quantity)}</strong>
              </div>
              <Button
                className="product-detail-add"
                variant="primary"
                size="lg"
                loading={isAddingToCart}
                disabled={!product.canPurchase || availableToAdd < 1}
                icon={<ShoppingBag size={19} aria-hidden="true" />}
                iconPosition="right"
                onClick={addToCart}
              >
                Thêm vào giỏ
              </Button>
              <p className="product-detail-purchase-note">
                Bạn có thể xem lại sản phẩm trong giỏ hàng trước khi thanh toán.
              </p>
            </Card>
          </aside>
        </div>

        <section className="product-detail-story" aria-labelledby="product-detail-story-title">
          <div className="product-detail-story__intro">
            <p className="product-detail-eyebrow">Thông tin sản phẩm</p>
            <h2 id="product-detail-story-title">Thông tin chi tiết</h2>
            <ProductDescription description={product.detail} />
          </div>
          <div className="product-detail-feature-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <Card className="product-detail-feature" key={title}>
                <span className="product-detail-feature__icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Check className="product-detail-feature__check" size={18} aria-hidden="true" />
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ProductDetailPage;
