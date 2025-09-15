const prisma = require('../db/prisma');

// POST /clientes
async function createCustomer(req, res) {
  const { name, email } = req.body || {};
  const errors = [];
  if (typeof name !== 'string' || name.trim().length < 2) errors.push('name must be a string (>= 2 chars)');
  if (typeof email !== 'string' || !email.includes('@')) errors.push('email must be a valid email address');
  if (errors.length) return res.status(400).json({ error: 'Invalid payload', details: errors });

  try {
    const newCustomer = await prisma.customer.create({
      data: { name: name.trim(), email: email.trim() }
    });
    return res.status(201).json(newCustomer);
  } catch (e) {
    // P2002 is the Prisma error code for unique constraint violation
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Internal error creating customer' });
  }
}

// GET /clientes/:id/pedidos
async function listCustomerOrders(req, res) {
  const customerId = Number(req.params.id);
  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { id: 'asc' },
    include: { items: true }
  });
  return res.json(orders);
}

module.exports = { createCustomer, listCustomerOrders };