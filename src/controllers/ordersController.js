const prisma = require('../db/prisma');

// GET /pedidos
async function listOrders(req, res) {
  const orders = await prisma.order.findMany({
    orderBy: { id: 'asc' },
    include: { items: true }
  });
  return res.json(orders);
}

// GET /pedidos/:id
async function getOrderById(req, res) {
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json(order);
}

// POST /pedidos
async function createOrder(req, res) {
  const body = req.body || {};
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }

  // normaliza items
  const items = [];
  const errors = [];
  for (const [i, it] of body.items.entries()) {
    if (!it || typeof it !== 'object') { errors.push(`item[${i}] invalid`); continue; }
    const { productId, quantity } = it;
    if (!Number.isInteger(productId) || productId <= 0) errors.push(`item[${i}].productId must be integer > 0`);
    if (!Number.isInteger(quantity) || quantity <= 0) errors.push(`item[${i}].quantity must be integer > 0`);
    items.push({ productId, quantity });
  }
  if (errors.length) return res.status(400).json({ error: 'Invalid payload', details: errors });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Carrega produtos
      const ids = [...new Set(items.map(i => i.productId))];
      const products = await tx.product.findMany({ where: { id: { in: ids } } });
      const map = new Map(products.map(p => [p.id, p]));

      const insufficient = [];
      const detailed = [];

      for (const it of items) {
        const p = map.get(it.productId);
        if (!p) return { status: 400, error: `Product ${it.productId} does not exist` };

        if (p.stock < it.quantity) {
          insufficient.push({ productId: p.id, available: p.stock, requested: it.quantity });
        } else {
          const unitValue = Number(p.price);
          const totalValue = Number((unitValue * it.quantity).toFixed(2));
          detailed.push({ productId: p.id, quantity: it.quantity, unitValue, totalValue });
        }
      }

      if (insufficient.length) {
        return { status: 400, error: 'Insufficient stock for one or more items', items: insufficient };
      }

      // Decrementa estoque
      for (const it of items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } }
        });
      }

      const orderTotal = Number(detailed.reduce((acc, d) => acc + d.totalValue, 0).toFixed(2));

      // Cria pedido + order_products
      const order = await tx.order.create({
        data: {
          totalValue: orderTotal,
          items: {
            create: detailed.map(d => ({
              productId: d.productId,
              quantity: d.quantity,
              unitValue: d.unitValue,
              totalValue: d.totalValue
            }))
          }
        },
        include: { items: true }
      });

      return { order };
    });

    if (result.error) return res.status(result.status || 400).json(result);
    return res.status(201).json(result.order);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal error creating order' });
  }
}

module.exports = { listOrders, getOrderById, createOrder };
