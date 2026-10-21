export const products = Object.freeze([
  { id: 'vtx-001', title: 'CORE SNAPBACK', price: 8500, badge: 'NEW', img: '../images/cap-black.jpg', desc: 'Structured 6-panel snapback in heavyweight cotton twill with flat peak and embroidered Vertex graphic.' },
  { id: 'vtx-002', title: 'STUDIO DAD CAP', price: 7500, badge: '', img: '../images/cap-sand.jpg', desc: 'Unstructured everyday dad cap with a softly curved peak and minimal tonal embroidered emblem.' },
  { id: 'vtx-003', title: 'TRANSIT 5-PANEL', price: 8500, badge: '', img: '../images/cap-olive.jpg', desc: 'Low-profile technical 5-panel camper cap with brass eyelets and adjustable nylon webbing strap.' },
  { id: 'vtx-004', title: 'ARCHIVE CORDUROY', price: 8500, badge: '', img: '../images/cap-rust.jpg', desc: 'Heritage 8-wale rust corduroy cap featuring an unstructured crown and antiqued brass buckle closure.' }
]);

export const findProduct = id => products.find(product => product.id === id);

export const formatCurrency = amount => `₦${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
