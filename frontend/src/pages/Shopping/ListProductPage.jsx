import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  AlertCircle,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import starElement from "../../assets/elements/IMG_4811.PNG";
import diceElement from "../../assets/elements/IMG_4818.PNG";
import diceLightElement from "../../assets/elements/IMG_4819.PNG";
import { getAccessToken, getStoredUser } from "../../services/apiClient.js";
import { addCartItem, getCart, listProducts } from "../../services/shopService.js";
import { getCartProduct, getCartQuantity } from "../../utils/cart.js";
import "./ListProductPage.scss";

const categories = ["Tất cả", "Boardgame", "Thẻ trải nghiệm", "Quà lưu niệm"];

const productFallbackImages = [diceElement, diceLightElement, starElement];
const productTones = ["purple", "teal", "yellow", "red"];
const isVideoSource = (source) => /\.mp4(?:$|[?#])/i.test(source || "");

const presentProduct = (product, index, cart) => ({
  ...product,
  id: product.id || product._id,
  category: "Boardgame",
  image: product.images?.[0] || productFallbackImages[index % productFallbackImages.length],
  tone: productTones[index % productTones.length],
  tag: product.canPurchase ? "Đang mở bán" : "Tạm hết hàng",
  cartQuantity: getCartQuantity(cart, product.id || product._id),
});

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

const getCartOwner = () => {
  const user = getStoredUser();
  return user?.id || user?._id || null;
};

function AnimatedMetric({ value, decimals = 0, suffix = "", format }) {
  const [currentValue, setCurrentValue] = useState(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    return reduceMotion ? value : 0;
  });

  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return undefined;
    }

    const duration = 850;
    const startedAt = performance.now();
    let frameId;

    const tick = (timestamp) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      setCurrentValue(value * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  const displayValue = format
    ? format(currentValue)
    : currentValue.toFixed(decimals);

  return `${displayValue}${suffix}`;
}

function ProductCard({ product, onAdd, addingProductId }) {
  const availableToAdd = Math.max(0, product.stock - product.cartQuantity);
  return (
    <Card className={`product-card product-card--${product.tone}`}>
      <div className="product-card__visual">
        <span className="product-card__tag">{product.tag}</span>
        {isVideoSource(product.image) ? (
          <video className="product-card__media" src={product.image} autoPlay muted loop playsInline aria-hidden="true" />
        ) : (
          <img className="product-card__media" src={product.image} alt="" aria-hidden="true" />
        )}
        <span className="product-card__visual-label">CHẠM SẮC VIỆT</span>
      </div>
      <div className="product-card__content">
        <p className="product-card__category">{product.category}</p>
        <h3>{product.name}</h3>
        <strong className="product-card__price">
          {formatMoney(product.price)}
        </strong>
        <p className="product-card__description">Còn lại: {product.stock} sản phẩm</p>
        {product.cartQuantity > 0 && <p className="product-card__description">Đã có {product.cartQuantity} trong giỏ · Có thể thêm {availableToAdd}</p>}
        <div className="product-card__actions">
          <Button
            as={Link}
            to={`/products/${product.id}`}
            variant="secondary"
            size="sm"
          >
            Xem chi tiết
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!product.canPurchase || availableToAdd === 0 || addingProductId !== null}
            loading={addingProductId === product.id}
            onClick={() => onAdd(product)}
          >
            Thêm vào giỏ
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ProductCardSkeleton() {
  return (
    <Card className="product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card__visual">
        <Skeleton className="product-card__skeleton-art" />
      </div>
      <div className="product-card__content">
        <Skeleton width="38%" height={11} />
        <Skeleton className="product-card__skeleton-title" width="78%" height={25} />
        <Skeleton width="48%" height={27} />
        <Skeleton className="product-card__skeleton-description" count={2} height={13} />
        <div className="product-card__actions">
          <Skeleton height={38} borderRadius={7} />
          <Skeleton height={38} borderRadius={7} />
        </div>
      </div>
    </Card>
  );
}

function ListProductPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const addPending = useRef(false);
  const loadVersion = useRef(0);

  const loadProducts = useCallback(async () => {
    const version = ++loadVersion.current;
    const owner = getCartOwner();
    setIsLoading(true);
    setLoadError("");
    try {
      const [response, cartResponse] = await Promise.all([
        listProducts(),
        getAccessToken() ? getCart().catch(() => null) : Promise.resolve(null),
      ]);
      if (version === loadVersion.current && owner === getCartOwner()) {
        setProducts((response.data || []).map((product, index) => presentProduct(product, index, cartResponse?.data?.cart)));
      }
    } catch (error) {
      if (version === loadVersion.current) setLoadError(error.message || "Không thể tải danh sách sản phẩm.");
    } finally {
      if (version === loadVersion.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadProducts(); }, 0);
    const syncSession = () => { void loadProducts(); };
    window.addEventListener("auth:login", syncSession);
    window.addEventListener("auth:logout", syncSession);
    return () => {
      loadVersion.current += 1;
      window.clearTimeout(timeoutId);
      window.removeEventListener("auth:login", syncSession);
      window.removeEventListener("auth:logout", syncSession);
    };
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "Tất cả" || product.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, searchTerm]);

  const featuredProductHref = "/products/6ae29132202af087ffc22f2f";

  const handleAddToCart = async (product) => {
    if (addPending.current) return;
    if (!getAccessToken()) {
      toast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login", { state: { from: "/products" } });
      return;
    }
    addPending.current = true;
    const owner = getCartOwner();
    setAddingProductId(product.id);
    try {
      const response = await addCartItem(product.id, 1);
      window.dispatchEvent(new Event("cart:updated"));
      if (owner !== getCartOwner() || !getAccessToken()) return;
      const updatedProduct = getCartProduct(response.data.cart, product.id);
      if (updatedProduct) {
        setProducts((current) => current.map((item, index) => item.id === product.id
          ? presentProduct({ ...item, ...updatedProduct, canPurchase: updatedProduct.status === "active" && updatedProduct.stock > 0 }, index, response.data.cart)
          : item));
      }
      toast.success(`Đã thêm “${product.name}” vào giỏ hàng`);
    } catch (error) {
      if (owner !== getCartOwner() || !getAccessToken()) return;
      toast.error(error.message || "Không thể cập nhật giỏ hàng lúc này.");
      if (error.statusCode === 409) await loadProducts();
    } finally {
      addPending.current = false;
      setAddingProductId(null);
    }
  };

  return (
    <main className="product-list-page">
      <section
        className="product-list-hero"
        aria-labelledby="product-list-hero-title"
      >
        <img
          className="product-list-hero__element product-list-hero__element--star"
          src={starElement}
          alt=""
          aria-hidden="true"
        />
        <div className="product-list-hero__top">
          <article className="product-list-hero__side-card product-list-hero__side-card--left">
            <div className="product-list-hero__side-art">
              <img src={diceElement} alt="" aria-hidden="true" />
            </div>
            <p>Boardgame di sản</p>
            <strong>{formatMoney(299000)}</strong>
            <a
              className="product-list-hero__side-arrow"
              href={featuredProductHref}
              aria-label="Xem chi tiết Boardgame di sản"
            >
              <ArrowUpRight size={18} />
            </a>
          </article>
          <div className="product-list-hero__headline">
            <p className="product-list-page__eyebrow">
              <Sparkles size={15} aria-hidden="true" /> Sản phẩm Chạm Sắc Việt
            </p>
            <h1 id="product-list-hero-title">
              Những câu chuyện
              <br />
              <span>Việt Nam bạn yêu</span>
            </h1>
            <p>
              Chạm vào văn hóa, mở ra một hành trình chơi và khám phá thật khác.
            </p>
          </div>
          <article className="product-list-hero__side-card product-list-hero__side-card--right">
            <div className="product-list-hero__review-icon">
              <Star size={20} fill="currentColor" />
            </div>
            <strong>
              4.9 <span>★</span>
            </strong>
            <p>Được yêu thích bởi cộng đồng khám phá di sản Việt Nam</p>
            <a href="/products#product-catalog">
              Khám phá bộ sưu tập <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </article>
        </div>
        <div
          className="product-list-hero__stats"
          aria-label="Thông tin bộ sưu tập"
        >
          <div>
            <strong>
              <AnimatedMetric value={98} suffix="K+" />
            </strong>
            <span>người yêu di sản</span>
          </div>
          <div>
            <strong>
              <AnimatedMetric
                value={4}
                format={(currentValue) =>
                  Math.round(currentValue).toString().padStart(2, "0")
                }
              />
            </strong>
            <span>sản phẩm trong bộ sưu tập</span>
          </div>
          <div>
            <strong>
              <AnimatedMetric value={4.9} decimals={1} /> <span>★</span>
            </strong>
            <span>đánh giá từ cộng đồng</span>
          </div>
          <div>
            <strong>
              <AnimatedMetric value={100} suffix="%" />
            </strong>
            <span>cảm hứng Việt</span>
          </div>
        </div>
      </section>

      <section
        className="product-list-catalog"
        id="product-catalog"
        aria-labelledby="product-catalog-title"
      >
        <div className="product-list-catalog__heading">
          <div>
            <p className="product-list-page__eyebrow">Bộ sưu tập hiện tại</p>
            <h2 id="product-catalog-title">Chọn một câu chuyện để mang về</h2>
            <p>
              Những sản phẩm được thiết kế để bạn tiếp tục hành trình sau mỗi
              lần ghé thăm.
            </p>
          </div>
          <span className="product-list-catalog__count">
            {visibleProducts.length} sản phẩm
          </span>
        </div>
        <div className="product-list-toolbar">
          <label className="product-list-search" htmlFor="product-search">
            <Search size={18} aria-hidden="true" />
            <Input
              id="product-search"
              type="search"
              placeholder="Tìm sản phẩm..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <div className="product-list-filters" aria-label="Lọc theo danh mục">
            {categories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? "is-active" : ""}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="product-list-grid product-list-grid--loading" role="status" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        ) : loadError ? (
          <div className="product-list-empty" role="alert"><AlertCircle size={30} aria-hidden="true" /><h3>Không thể tải sản phẩm</h3><p>{loadError}</p><Button variant="secondary" onClick={loadProducts}>Thử lại</Button></div>
        ) : visibleProducts.length ? (
          <div className="product-list-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
                addingProductId={addingProductId}
              />
            ))}
          </div>
        ) : (
          <div className="product-list-empty">
            <ShoppingBag size={30} aria-hidden="true" />
            <h3>Chưa tìm thấy sản phẩm phù hợp</h3>
            <p>Thử đổi từ khóa hoặc chọn một danh mục khác nhé.</p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm("");
                setActiveCategory("Tất cả");
              }}
            >
              Xem tất cả sản phẩm
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}

export default ListProductPage;
