import { useState } from "react";
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
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import starElement from "../../assets/elements/IMG_4811.PNG";
import diceElement from "../../assets/elements/IMG_4818.PNG";
import diceLightElement from "../../assets/elements/IMG_4819.PNG";
import elementFour from "../../assets/elements/IMG_4820.PNG";
import elementFive from "../../assets/elements/IMG_4821.PNG";
import "./ProductDetailPage.scss";

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
    detail:
      "Một trò chơi bàn nhỏ gọn để mỗi lượt gieo xúc xắc mở ra một điểm chạm mới với di sản Việt.",
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
    detail:
      "Bộ thẻ kết nối những mẩu chuyện ngắn, hình ảnh và câu hỏi vui để khám phá cùng nhau.",
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
    detail:
      "Một khoảng trống vừa đủ để lưu lại địa danh, chất liệu và những điều bạn muốn nhớ.",
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
    detail:
      "Bộ sản phẩm dành cho những buổi chơi dài hơn, nhiều câu chuyện hơn và nhiều người cùng tham gia hơn.",
  },
];

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

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.id === productId);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedImages, setSelectedImages] = useState({});
  const selectedImage = selectedImages[productId] || product?.image;

  const addToCart = () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItem = storedCart.find(
        (item) => item.productId === product.id,
      );
      const cart = existingItem
        ? storedCart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [
            ...storedCart,
            {
              productId: product.id,
              productName: product.name,
              unitPrice: product.price,
              quantity,
            },
          ];

      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart:updated"));
      toast.success(`Đã thêm “${product.name}” vào giỏ hàng`);
    } catch {
      toast.error("Không thể cập nhật giỏ hàng lúc này.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (!product) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-state">
          <Sparkles size={30} aria-hidden="true" />
          <h1>Không tìm thấy sản phẩm</h1>
          <p>Sản phẩm này có thể đã được thay đổi hoặc không còn tồn tại.</p>
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
            <p className="product-detail-lede">{product.description}</p>
            <div className="product-detail-rating" aria-label="Được đánh giá 4.9 trên 5">
              <Star size={17} fill="currentColor" aria-hidden="true" />
              <strong>4.9</strong>
              <span>Được yêu thích bởi cộng đồng khám phá di sản</span>
            </div>
            <div className="product-detail-gallery">
              <div className="product-detail-thumbnails" aria-label="Ảnh sản phẩm">
                {[product.image, diceElement, diceLightElement, starElement, elementFour, elementFive]
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
                      <img src={image} alt="" aria-hidden="true" />
                    </button>
                  ))}
              </div>
              <div className={`product-detail-visual product-detail-visual--${product.tone}`}>
                <span className="product-detail-tag">{product.tag}</span>
                <img src={selectedImage || product.image} alt={`Hình minh họa ${product.name}`} />
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
                <span aria-hidden="true" /> Đang mở bán
              </div>
              <div className="product-detail-price-row">
                <span>Giá sản phẩm</span>
                <strong>{formatMoney(product.price)}</strong>
              </div>
              <div className="product-detail-stock">
                <span>Còn lại</span>
                <strong>25</strong>
              </div>
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
                    disabled={quantity >= 25 || isAddingToCart}
                    onClick={() => setQuantity((value) => Math.min(25, value + 1))}
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
            <p className="product-detail-eyebrow">Một điểm chạm đáng nhớ</p>
            <h2 id="product-detail-story-title">Mang câu chuyện Việt về gần hơn.</h2>
            <p>{product.detail}</p>
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
