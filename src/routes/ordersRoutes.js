const express = require('express');
const {
    listOrders,
    getOrderById,
    createOrder,
    confirmPayment,
    getOrderPayments
} = require('../controllers/ordersController');

const router = express.Router();

router.get('/', listOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.post('/:id/confirm-payment', confirmPayment); // Nova rota
router.get('/:id/payments', getOrderPayments);     // Nova rota

module.exports = router;