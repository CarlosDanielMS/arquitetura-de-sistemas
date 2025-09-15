const express = require('express');
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock, // importa a nova função
  deleteProduct,
} = require('../controllers/productsController');

const router = express.Router();

router.get('/', listProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id/stock', updateStock); // Adiciona a nova rota
router.delete('/:id', deleteProduct);

module.exports = router;