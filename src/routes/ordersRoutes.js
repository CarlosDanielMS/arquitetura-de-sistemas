const express = require('express');
const { listOrders, getOrderById, createOrder } = require('../controllers/ordersController');

const router = express.Router();

router.get('/', listOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);

module.exports = router;
