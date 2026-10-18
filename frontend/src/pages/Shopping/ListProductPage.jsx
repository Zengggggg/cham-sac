import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import starElement from "../../assets/elements/IMG_4811.PNG";
import diceElement from "../../assets/elements/IMG_4818.PNG";
import diceLightElement from "../../assets/elements/IMG_4819.PNG";
import "./ListProductPage.scss";

const categories = ["Tất cả", "Boardgame", "Thẻ trải nghiệm", "Quà lưu niệm"];

const products = [
  {
    id: "boardgame-cham-sac-viet",
    name: "Boardgame Chạm Sắc Việt",
    category: "Boardgame",
    price: 299000,
    description:
      "Cùng bạn bè mở những câu chuyện văn hóa Việt qua từng lượt chơi.",
    image: diceElement,
    tone: "purple",
    tag: "Bán chạy",
  },
  {
    id: "bo-the-di-san",
    name: "Bộ thẻ bài mini Di sản Việt",
    category: "Thẻ trải nghiệm",
    price: 149000,
    description:
      "Bộ thẻ nhỏ gọn để khám phá địa danh, chất liệu và chuyện xưa.",
    image: diceLightElement,
    tone: "teal",
    tag: "Mới ra mắt",
  },
  {
    id: "so-tay-hanh-trinh",
    name: "Sổ tay hành trình di sản Việt",
    category: "Quà lưu niệm",
    price: 89000,
    description:
      "Ghi lại những điểm chạm đáng nhớ trong hành trình khám phá của bạn.",
    image: starElement,
    tone: "yellow",
    tag: "Gợi ý cho bạn",
  },
  {
    id: "combo-kham-pha",
    name: "Combo Khám phá Việt Nam",
    category: "Boardgame",
    price: 399000,
    description:
      "Một bộ sưu tập trọn vẹn cho buổi chơi cùng gia đình và bạn bè.",
    image: diceElement,
    tone: "red",
    tag: "Tiết kiệm hơn",
  },
];

const formatMoney = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

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

function ProductCard({ product, onAdd }) {
  return (
    <Card className={`product-card product-card--${product.tone}`}>
      <div className="product-card__visual">
        <span className="product-card__tag">{product.tag}</span>
        <img src={product.image} alt="" aria-hidden="true" />
        <span className="product-card__visual-label">CHẠM SẮC VIỆT</span>
      </div>
      <div className="product-card__content">
        <p className="product-card__category">{product.category}</p>
        <h3>{product.name}</h3>
        <strong className="product-card__price">
          {formatMoney(product.price)}
        </strong>
        <p className="product-card__description">Còn lại: 25 sản phẩm</p>
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
            onClick={() => onAdd(product)}
          >
            Thêm vào giỏ
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ListProductPage() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

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
  }, [activeCategory, searchTerm]);

  const handleAddToCart = (product) => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItem = storedCart.find(
        (item) => item.productId === product.id,
      );
      const cart = existingItem
        ? storedCart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [
            ...storedCart,
            {
              productId: product.id,
              productName: product.name,
              unitPrice: product.price,
              quantity: 1,
            },
          ];
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart:updated"));
      toast.success(`Đã thêm “${product.name}” vào giỏ hàng`);
    } catch {
      toast.error("Không thể cập nhật giỏ hàng lúc này.");
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
            <span className="product-list-hero__side-arrow" aria-hidden="true">
              <ArrowUpRight size={18} />
            </span>
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
            <Link to="#product-catalog">
              Khám phá bộ sưu tập <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
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
        {visibleProducts.length ? (
          <div className="product-list-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddToCart}
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
