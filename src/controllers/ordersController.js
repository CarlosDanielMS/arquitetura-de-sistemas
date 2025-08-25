// src/controllers/ordersController.js
// Implementa a criação de pedidos com verificação de estoque, decremento e retorno adequado.

const {
  orders,
  getNextOrderId,
  products,
  findProduct,
  validateOrderPayload,
} = require('../data/store');

// GET /pedidos — lista todos os pedidos
function listOrders(req, res) {
  return res.json(orders);
}

// POST /pedidos — cria pedido com checagem de estoque
function createOrder(req, res) {
  // 1) valida o payload (estrutura dos itens)
  const valid = validateOrderPayload(req.body);
  if (!valid.ok) return res.status(400).json({ error: 'Invalid payload', details: valid.errors });

  // 2) verifica existência e estoque de cada produto
  const insufficient = [];     // acumula itens sem estoque suficiente
  const detailedItems = [];    // acumula itens já com preço e subtotal calculado

  for (const item of valid.items) {
    const product = findProduct(item.productId);
    if (!product) return res.status(400).json({ error: `Product ${item.productId} does not exist` });

    if (product.stock < item.quantity) {
      insufficient.push({ productId: product.id, available: product.stock, requested: item.quantity });
    } else {
      const subtotal = Number((product.price * item.quantity).toFixed(2));
      detailedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
      });
    }
  }

  // 3) se faltar estoque em qualquer item, retorna 400 e NÃO cria o pedido
  if (insufficient.length > 0) {
    return res.status(400).json({
      error: 'Insufficient stock for one or more items',
      items: insufficient,
    });
  }

  // 4) tudo ok — decrementa estoque de todos os itens
  for (const item of valid.items) {
    const product = findProduct(item.productId);
    product.stock -= item.quantity;
  }

  // 5) cria o pedido e retorna 201
  const total = Number(detailedItems.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2));
  const order = {
    id: getNextOrderId(),
    items: detailedItems,
    total,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);

  return res.status(201).json(order);
}

module.exports = {
  listOrders,
  createOrder,
};
