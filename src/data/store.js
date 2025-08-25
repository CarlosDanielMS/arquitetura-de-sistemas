// src/data/store.js
// Armazena dados em memória e funções utilitárias usadas pelos controllers.

// IDs incrementais para products e orders
let nextProductId = 3;
let nextOrderId = 1;

// Lista inicial de produtos (mock)
const products = [
  { id: 1, name: 'Mechanical Keyboard', price: 250.0, stock: 10 },
  { id: 2, name: 'Gaming Mouse',       price: 150.0, stock: 8  },
];

// Lista de pedidos criada em runtime
const orders = [];

/** Encontra um produto pelo ID */
function findProduct(id) {
  return products.find(p => p.id === id);
}

/** Valida payload de produto (criação e atualização parcial) */
function validateProductPayload(body, partial = false) {
  const errors = [];
  const out = {};

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2)
      errors.push('name must be a string (>= 2 chars)');
    else out.name = body.name.trim();
  }
  if (!partial || body.price !== undefined) {
    if (typeof body.price !== 'number' || !isFinite(body.price) || body.price < 0)
      errors.push('price must be a number >= 0');
    else out.price = Number(body.price);
  }
  if (!partial || body.stock !== undefined) {
    if (!Number.isInteger(body.stock) || body.stock < 0)
      errors.push('stock must be an integer >= 0');
    else out.stock = body.stock;
  }

  return { ok: errors.length === 0, errors, out };
}

/** Valida payload de pedido */
function validateOrderPayload(body) {
  const errors = [];
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, errors: ['items must be a non-empty array'] };
  }
  const items = [];
  for (const [i, it] of body.items.entries()) {
    if (!it || typeof it !== 'object') { errors.push(`item[${i}] invalid`); continue; }
    const { productId, quantity } = it;
    if (!Number.isInteger(productId) || productId <= 0) errors.push(`item[${i}].productId must be integer > 0`);
    if (!Number.isInteger(quantity) || quantity <= 0) errors.push(`item[${i}].quantity must be integer > 0`);
    items.push({ productId, quantity });
  }
  return { ok: errors.length === 0, errors, items };
}

module.exports = {
  // dados
  products,
  orders,
  // ids
  getNextProductId: () => nextProductId++,
  getNextOrderId: () => nextOrderId++,
  // helpers
  findProduct,
  validateProductPayload,
  validateOrderPayload,
};
