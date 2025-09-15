const prisma = require('../db/prisma');

// ... (listOrders, getOrderById) - permanecem iguais

// POST /pedidos
async function createOrder(req, res) {
  const { customerId, items: requestItems } = req.body || {};

  if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'customerId must be an integer > 0' });
  }

  if (!Array.isArray(requestItems) || requestItems.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }
  // ... (a lógica de validação de items e transação continua a mesma,
  // apenas adicionando 'customerId' na criação do pedido)

  // Dentro do prisma.$transaction, ao criar o pedido:
  const order = await tx.order.create({
    data: {
      customerId, // Adicionado
      totalValue: orderTotal,
      items: {
        create: detailed.map(d => ({
          productId: d.productId,
          quantity: d.quantity,
          unitValue: d.unitValue,
          totalValue: d.totalValue
        }))
      }
    },
    include: { items: true }
  });
  // ... resto da função
}

// POST /pedidos/:id/confirm-payment
async function confirmPayment(req, res) {
    const orderId = Number(req.params.id);
    const { payments } = req.body;

    if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({ error: 'payments must be a non-empty array' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({ where: { id: orderId } });
            if (!order) return { status: 404, error: 'Order not found' };
            if (order.status !== 'AGUARDANDO_PAGAMENTO') {
                return { status: 400, error: `Order is already ${order.status}` };
            }

            let totalPaid = 0;
            let hasFailedPayment = false;

            for (const p of payments) {
                // Em um cenário real, aqui você integraria com um gateway de pagamento
                // Para simular, vamos assumir que 'success: false' pode ser enviado no payload
                const paymentSuccess = p.success !== false;

                await tx.payment.create({
                    data: {
                        orderId,
                        method: p.method,
                        amount: p.amount,
                        success: paymentSuccess,
                    }
                });

                if (paymentSuccess) {
                    totalPaid += Number(p.amount);
                } else {
                    hasFailedPayment = true;
                }
            }

            if (hasFailedPayment) {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'FALHA_NO_PAGAMENTO' }
                });
                // Devolve o estoque dos produtos
                const orderItems = await tx.orderProduct.findMany({ where: { orderId } });
                for (const item of orderItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });
                }
                return { status: 400, error: 'A payment method failed. Order canceled and stock restored.' };
            }

            if (totalPaid < order.totalValue) {
                 return { status: 400, error: `Total paid (${totalPaid}) is less than order total (${order.totalValue}). Payment not confirmed.` };
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: 'PAGO' }
            });

            return { order: updatedOrder };
        });

        if (result.error) return res.status(result.status || 400).json(result);
        return res.status(200).json(result.order);

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal error processing payment' });
    }
}

// GET /pedidos/:id/payments
async function getOrderPayments(req, res) {
    const orderId = Number(req.params.id);
    const payments = await prisma.payment.findMany({
        where: { orderId },
        orderBy: { id: 'asc' }
    });
    return res.json(payments);
}


module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  confirmPayment,
  getOrderPayments
};