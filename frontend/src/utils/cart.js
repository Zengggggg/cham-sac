export const normalizeCartItems = (cart) => (cart?.items || []).map((item) => {
  const stock = Number(item.product?.stock) || 0;

  return {
    ...item,
    productId: String(item.productId),
    productName: item.product?.name || "Sản phẩm không còn tồn tại",
    unitPrice: Number(item.product?.price) || 0,
    quantity: Number(item.quantity) || 0,
    stock,
    image: item.product?.images?.[0] || "",
    category: item.product?.category || "Sản phẩm Chạm Sắc Việt",
    isAvailable: Boolean(item.product) && item.isAvailable !== false,
  };
});

export const getCartProduct = (cart, productId) => cart?.items
  ?.find((item) => String(item.productId) === String(productId))?.product;

export const getCartQuantity = (cart, productId) => Number(cart?.items
  ?.find((item) => String(item.productId) === String(productId))?.quantity) || 0;
