// src/routes/productsRoutes.js
// Router do Express que mapeia URLs para controllers de produtos.

const express = require('express');
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
} = require('../controllers/productsController');

const router = express.Router();

// GET /produtos
router.get('/', listProducts);

// GET /produtos/:id
router.get('/:id', getProductById);

// POST /produtos
router.post('/', createProduct);

// PUT /produtos/:id
router.put('/:id', updateProduct);

module.exports = router;
