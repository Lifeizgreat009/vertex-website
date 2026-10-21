import { products, findProduct, formatCurrency } from './product-data.js';
import { addToCart, clearCart, getCart, getCartQuantity, getCartTotal, updateCartItem } from './cart-state.js';

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const cartPanel = $('cartPanel');
  const quickViewModal = $('quickViewModal');
  const drawerBackdrop = $('drawerBackdrop');
  const productsContainer = $('products');
  const cartItemsEl = $('cartItems');
  const toastContainer = $('toastContainer');
  const menuToggle = $('menuToggle');
  const mainNav = $('mainNav');
  const siteHeader = document.querySelector('.site-header');
  const hero = $('hero');
  let activeQuickViewProduct = null;
  let activeDialog = null;
  let dialogOpener = null;

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  function getFocusable(dialog) {
    return [...dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hidden && element.getClientRects().length);
  }

  function trapFocus(event) {
    if (!activeDialog || event.key !== 'Tab') return;
    const focusable = getFocusable(activeDialog);
    if (!focusable.length) return event.preventDefault();
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openDialog(dialog, opener) {
    if (activeDialog && activeDialog !== dialog) closeDialog(false);
    activeDialog = dialog;
    dialogOpener = opener || document.activeElement;
    dialog.setAttribute('aria-hidden', 'false');
    drawerBackdrop.classList.add('is-active');
    drawerBackdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('scroll-locked');
    requestAnimationFrame(() => getFocusable(dialog)[0]?.focus());
  }

  function closeDialog(restoreFocus = true) {
    if (!activeDialog) return;
    const closingDialog = activeDialog;
    const opener = dialogOpener;
    closingDialog.setAttribute('aria-hidden', 'true');
    activeDialog = null;
    dialogOpener = null;
    activeQuickViewProduct = closingDialog === quickViewModal ? null : activeQuickViewProduct;
    drawerBackdrop.classList.remove('is-active');
    drawerBackdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('scroll-locked');
    if (restoreFocus && opener instanceof HTMLElement && document.contains(opener)) opener.focus();
  }

  function showToast(message, icon = 'fa-circle-check') {
    const toast = createElement('div', 'toast');
    const iconEl = createElement('i', `fa-solid ${icon} toast-icon`);
    iconEl.setAttribute('aria-hidden', 'true');
    toast.append(iconEl, createElement('span', '', message));
    toastContainer.append(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => { toast.classList.replace('toast-show', 'toast-hide'); setTimeout(() => toast.remove(), 250); }, 2600);
  }

  function renderProducts(list = products) {
    $('productCount').textContent = `${String(list.length).padStart(2, '0')} pieces`;
    productsContainer.replaceChildren();
    if (!list.length) return productsContainer.append(createElement('p', 'no-results', 'No pieces match that search.'));
    list.forEach((product, index) => {
      const card = createElement('article', 'product-card scroll-reveal');
      card.dataset.id = product.id;
      card.tabIndex = 0;
      card.style.setProperty('--reveal-delay', `${index * 70}ms`);
      card.setAttribute('aria-label', `View ${product.title}`);
      const imageWrap = createElement('div', 'product-image');
      if (product.badge) imageWrap.append(createElement('span', 'product-badge', product.badge));
      const image = createElement('img'); image.src = product.img; image.alt = product.title; image.loading = 'lazy';
      const addButton = createElement('button', 'card-quick-add');
      addButton.type = 'button'; addButton.dataset.id = product.id; addButton.dataset.action = 'add'; addButton.setAttribute('aria-label', `Add ${product.title} to bag`);
      addButton.append(createElement('span', '', 'Add to bag'), createElement('span', 'plus-icon', '+'));
      imageWrap.append(image, addButton);
      const info = createElement('div', 'product-info');
      info.append(createElement('h3', 'product-title', product.title), createElement('div', 'product-price', formatCurrency(product.price)));
      card.append(imageWrap, info); productsContainer.append(card);
    });
    observeRevealElements();
  }

  function makeCartControl(id, action, label, text) {
    const button = createElement('button', '', text);
    button.type = 'button'; button.dataset.id = id; button.dataset.action = action; button.setAttribute('aria-label', label);
    return button;
  }

  function renderCart() {
    const cart = getCart(); const items = Object.values(cart); const quantity = getCartQuantity(cart);
    cartItemsEl.replaceChildren();
    if (!items.length) cartItemsEl.append(createElement('p', 'cart-empty', 'Your bag is waiting for something good.'));
    items.forEach(item => {
      const row = createElement('div', 'cart-item');
      const image = createElement('img'); image.src = item.img; image.alt = item.title;
      const meta = createElement('div', 'meta');
      const controls = createElement('div', 'cart-item-controls');
      controls.append(makeCartControl(item.id, 'dec', 'Decrease quantity', '−'), makeCartControl(item.id, 'inc', 'Increase quantity', '+'), makeCartControl(item.id, 'rm', 'Remove item', 'Remove'));
      meta.append(createElement('div', '', item.title), createElement('small', '', `${formatCurrency(item.price)} × ${item.qty}`), controls);
      row.append(image, meta, createElement('strong', '', formatCurrency(item.price * item.qty))); cartItemsEl.append(row);
    });
    $('cartCount').textContent = quantity; $('cartHeaderCount').textContent = `(${quantity})`; $('cartTotal').textContent = formatCurrency(getCartTotal(cart));
  }

  function openCart(opener) { renderCart(); openDialog(cartPanel, opener); }
  function openQuickView(product, opener) {
    activeQuickViewProduct = product;
    $('quickViewImg').src = product.img; $('quickViewImg').alt = product.title; $('quickViewTitle').textContent = product.title;
    $('quickViewPrice').textContent = formatCurrency(product.price); $('quickViewDesc').textContent = product.desc;
    openDialog(quickViewModal, opener);
  }

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
    entry.target.classList.toggle('is-exiting', !entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0));
  }), { threshold: 0.12, rootMargin: '-12% 0px -12% 0px' }) : null;
  function observeRevealElements() { document.querySelectorAll('.scroll-reveal:not(.is-visible)').forEach(element => revealObserver ? revealObserver.observe(element) : element.classList.add('is-visible')); }
  function updateHeaderState() {
    const isPastHero = hero.getBoundingClientRect().bottom <= siteHeader.offsetHeight;
    siteHeader.classList.toggle('is-scrolled', isPastHero); siteHeader.style.backgroundColor = isPastHero ? '#090909' : 'transparent';
  }

  $('year').textContent = new Date().getFullYear();
  setTimeout(() => { $('splash').classList.add('hidden'); $('splash').setAttribute('aria-hidden', 'true'); }, 3000);
  $('cartBtn').addEventListener('click', event => openCart(event.currentTarget));
  $('closeCart').addEventListener('click', () => closeDialog()); $('closeQuickView').addEventListener('click', () => closeDialog());
  drawerBackdrop.addEventListener('click', () => closeDialog());
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && activeDialog) closeDialog(); else trapFocus(event); });
  productsContainer.addEventListener('click', event => {
    const addButton = event.target.closest('button[data-action="add"]'); const card = event.target.closest('.product-card');
    if (addButton) { event.stopPropagation(); const product = addToCart(addButton.dataset.id); if (product) { renderCart(); showToast(`${product.title} added to bag.`); } return; }
    if (card) openQuickView(findProduct(card.dataset.id), card);
  });
  productsContainer.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.product-card')) { event.preventDefault(); openQuickView(findProduct(event.target.dataset.id), event.target); } });
  $('quickViewAddBtn').addEventListener('click', () => { if (activeQuickViewProduct) { addToCart(activeQuickViewProduct.id); renderCart(); showToast(`${activeQuickViewProduct.title} added to bag.`); } });
  cartItemsEl.addEventListener('click', event => { const button = event.target.closest('button[data-action]'); if (!button) return; const item = updateCartItem(button.dataset.id, button.dataset.action); renderCart(); if (item && button.dataset.action === 'rm') showToast(`${item.title} removed.`); });
  $('sortProducts').addEventListener('change', event => { const sorted = [...products]; if (event.target.value === 'low') sorted.sort((a, b) => a.price - b.price); if (event.target.value === 'high') sorted.sort((a, b) => b.price - a.price); renderProducts(sorted); });
  $('newsletterForm').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; form.replaceChildren(createElement('span', 'form-success', 'You are on the list. Welcome to the edge.')); showToast('Subscribed! Welcome to the edge.', 'fa-envelope'); });
  $('checkoutBtn').addEventListener('click', () => { const cart = getCart(); if (!Object.keys(cart).length) return showToast('Your bag is empty.', 'fa-circle-exclamation'); const total = formatCurrency(getCartTotal(cart)); clearCart(); renderCart(); closeDialog(); showToast(`Order placed (${total})! Thank you.`, 'fa-bag-shopping'); });
  menuToggle.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') === 'true'; menuToggle.setAttribute('aria-expanded', String(!open)); mainNav.classList.toggle('open', !open); });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { mainNav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }));
  window.addEventListener('resize', () => { if (window.innerWidth > 800) { mainNav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); } }); window.addEventListener('scroll', updateHeaderState, { passive: true });
  renderProducts(); renderCart(); document.querySelectorAll('.shop, .about, .contact').forEach(section => section.classList.add('scroll-reveal')); observeRevealElements(); updateHeaderState();
});
