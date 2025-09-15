const prisma = require('../db/prisma');

// ... (listProducts, getProductById, createProduct) - permanecem iguais

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
  // Removida a lógica de estoque daqui
  if ('stock' in req.body) {
    return res.status(400).json({ error: 'Stock cannot be updated from this endpoint. Use PATCH /produtos/:id/stock instead.' });
  }
  if (errors.length) return res.status(400).json({ error: 'Invalid payload', details: errors });

  try {
    const product = await prisma.product.update({ where: { id }, data });
    return res.json(product);
  } catch {
    return res.status(404).json({ error: 'Product not found' });
  }
}

// PATCH /produtos/:id/stock
async function updateStock(req, res) {
    const id = Number(req.params.id);
    const { stock } = req.body;

    if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({ error: 'stock must be an integer >= 0' });
    }

    try {
        const product = await prisma.product.update({
            where: { id },
            data: { stock }
        });
        return res.json(product);
    } catch {
        return res.status(404).json({ error: 'Product not found' });
    }
}


// DELETE /produtos/:id - permanece igual
// ...

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock, // exporta a nova função
  deleteProduct,
};