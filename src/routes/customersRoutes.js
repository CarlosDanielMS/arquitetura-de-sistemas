const express = require('express');
const { createCustomer, listCustomerOrders } = require('../controllers/customersController');

const router = express.Router();

router.post('/', createCustomer);
router.get('/:id/pedidos', listCustomerOrders);

module.exports = router;