// src/controllers/productsController.js
// Recebe req/res, usa o store (dados + validações) e responde.

// Importa o “banco” em memória e utilitários
const {
  products,
  getNextProductId,
  findProduct,
  validateProductPayload,
} = require('../data/store');

// GET /produtos — lista todos os produtos
function listProducts(req, res) {
  return res.json(products);
}

// GET /produtos/:id — busca produto por id
function getProductById(req, res) {
  const id = Number(req.params.id);
  const product = findProduct(id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(product);
}

// POST /produtos — cria novo produto
function createProduct(req, res) {
  const { ok, errors, out } = validateProductPayload(req.body, false);
  if (!ok) return res.status(400).json({ error: 'Invalid payload', details: errors });

  const newProduct = { id: getNextProductId(), ...out };
  products.push(newProduct);
  return res.status(201).json(newProduct);
}

// PUT /produtos/:id — atualização parcial
function updateProduct(req, res) {
  const id = Number(req.params.id);
  const product = findProduct(id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { ok, errors, out } = validateProductPayload(req.body, true);
  if (!ok) return res.status(400).json({ error: 'Invalid payload', details: errors });

  Object.assign(product, out);
  return res.json(product);
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
};
