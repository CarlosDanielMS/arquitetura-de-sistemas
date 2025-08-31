const prisma = require('../db/prisma');

// GET /produtos
async function listProducts(req, res) {
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  return res.json(products);
}

// GET /produtos/:id
async function getProductById(req, res) {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(product);
}

// POST /produtos
async function createProduct(req, res) {
  const { name, price, stock } = req.body || {};
  const errors = [];
  if (typeof name !== 'string' || name.trim().length < 2) errors.push('name must be a string (>= 2 chars)');
  if (typeof price !== 'number' || !isFinite(price) || price < 0) errors.push('price must be a number >= 0');
  if (!Number.isInteger(stock) || stock < 0) errors.push('stock must be an integer >= 0');
  if (errors.length) return res.status(400).json({ error: 'Invalid payload', details: errors });

  const newProduct = await prisma.product.create({
    data: { name: name.trim(), price, stock }
  });
  return res.status(201).json(newProduct);
}

// PUT /produtos/:id
async function updateProduct(req, res) {
  const id = Number(req.params.id);
  const data = {};
  const errors = [];

  if ('name' in req.body) {
    if (typeof req.body.name !== 'string' || req.body.name.trim().length < 2) errors.push('name must be a string (>= 2 chars)');
    else data.name = req.body.name.trim();
  }
  if ('price' in req.body) {
    if (typeof req.body.price !== 'number' || !isFinite(req.body.price) || req.body.price < 0) errors.push('price must be a number >= 0');
    else data.price = req.body.price;
  }
  if ('stock' in req.body) {
    if (!Number.isInteger(req.body.stock) || req.body.stock < 0) errors.push('stock must be an integer >= 0');
    else data.stock = req.body.stock;
  }
  if (errors.length) return res.status(400).json({ error: 'Invalid payload', details: errors });

  try {
    const product = await prisma.product.update({ where: { id }, data });
    return res.json(product);
  } catch {
    return res.status(404).json({ error: 'Product not found' });
  }
}

// DELETE /produtos/:id
async function deleteProduct(req, res) {
  const id = Number(req.params.id);
  try {
    await prisma.product.delete({ where: { id } });
    return res.status(204).send();
  } catch {
    return res.status(404).json({ error: 'Product not found' });
  }
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
