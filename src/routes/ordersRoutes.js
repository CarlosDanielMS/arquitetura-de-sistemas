// src/routes/ordersRoutes.js
// Router do Express que mapeia URLs para controllers de pedidos.

const express = require('express');
const {
  listOrders,
  createOrder,
} = require('../controllers/ordersController');

const router = express.Router();

// GET /pedidos
router.get('/', listOrders);

// POST /pedidos
router.post('/', createOrder);

module.exports = router;
