import assert from "node:assert/strict";
import test from "node:test";
import { getCartProduct, getCartQuantity, normalizeCartItems } from "../src/utils/cart.js";

test("cart preserves each real product identity, image, price and quantity", () => {
  const cart = { items: [
    {
      productId: "product-b", quantity: 2, selected: true, isAvailable: true,
      product: { id: "product-b", name: "Bộ thẻ di sản", price: 149000, stock: 5, images: ["/cards.jpg"] },
    },
    {
      productId: "product-a", quantity: 1, selected: false, isAvailable: true,
      product: { id: "product-a", name: "Boardgame", price: 299000, stock: 3, images: ["/boardgame.jpg"] },
    },
  ] };
  const items = normalizeCartItems(cart);

  assert.deepEqual(items.map(({ productId, productName, image, unitPrice, quantity, selected }) => (
    { productId, productName, image, unitPrice, quantity, selected }
  )), [
    { productId: "product-b", productName: "Bộ thẻ di sản", image: "/cards.jpg", unitPrice: 149000, quantity: 2, selected: true },
    { productId: "product-a", productName: "Boardgame", image: "/boardgame.jpg", unitPrice: 299000, quantity: 1, selected: false },
  ]);
  assert.equal(getCartProduct(cart, "product-a").name, "Boardgame");
  assert.equal(getCartQuantity(cart, "product-b"), 2);
  assert.equal(getCartQuantity(cart, "not-in-cart"), 0);
});

test("cart keeps real stock distinct from the quantity this customer added", () => {
  const [item] = normalizeCartItems({ items: [{
    productId: "product-a", quantity: 3, isAvailable: true,
    product: { name: "Boardgame", price: 299000, stock: 5 },
  }] });

  assert.equal(item.stock, 5);
  assert.equal(item.quantity, 3);
  assert.equal(item.isAvailable, true);
});

test("missing or unavailable products remain identifiable without mock product data", () => {
  const items = normalizeCartItems({ items: [
    { productId: "deleted-product", quantity: 1, selected: true, product: null, isAvailable: false },
    { productId: "inactive-product", quantity: 1, selected: true, product: { name: "Ngừng bán", stock: 2 }, isAvailable: false },
  ] });

  assert.equal(items[0].productId, "deleted-product");
  assert.equal(items[0].productName, "Sản phẩm không còn tồn tại");
  assert.equal(items[0].image, "");
  assert.equal(items[0].isAvailable, false);
  assert.equal(items[1].isAvailable, false);
  assert.deepEqual(normalizeCartItems(null), []);
});
