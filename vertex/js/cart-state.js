import { findProduct } from './product-data.js';

const cartKey = 'vertex_cart_v2';

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(cartKey)) || {};
    return Object.entries(stored).reduce((cart, [id, item]) => {
      const product = findProduct(id);
      const qty = Number.parseInt(item?.qty, 10);
      if (product && Number.isFinite(qty) && qty > 0) cart[id] = { ...product, qty };
      return cart;
    }, {});
  } catch {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

export const getCart = () => readCart();
export const getCartQuantity = cart => Object.values(cart).reduce((total, item) => total + item.qty, 0);
export const getCartTotal = cart => Object.values(cart).reduce((total, item) => total + item.price * item.qty, 0);

export function addToCart(id) {
  const product = findProduct(id);
  if (!product) return null;
  const cart = readCart();
  cart[id] = { ...product, qty: (cart[id]?.qty || 0) + 1 };
  writeCart(cart);
  return product;
}

export function updateCartItem(id, action) {
  const cart = readCart();
  const item = cart[id];
  if (!item) return null;
  if (action === 'inc') item.qty += 1;
  if (action === 'dec') item.qty = Math.max(1, item.qty - 1);
  if (action === 'rm') delete cart[id];
  writeCart(cart);
  return item;
}

export function clearCart() {
  localStorage.removeItem(cartKey);
}
