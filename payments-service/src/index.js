const express = require("express");
const { PrismaClient, PaymentStatus } = require("@prisma/client");
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./swagger");
const api = require("./utils/api");

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Criar pagamento
app.post("/payments", async (req, res) => {
  try {
    const payment = await prisma.payment.create({
      data: {
        orderId: req.body.orderId,
        amount: req.body.amount,
        status: PaymentStatus.AGUARDANDO_PAGAMENTO
      }
    });
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// Processar pagamento
app.patch("/payments/:id/process", async (req, res) => {
  const id = parseInt(req.params.id);
  const payment = await prisma.payment.findUnique({ where: { id } });

  if (!payment) return res.status(404).json({ error: "Pagamento não encontrado" });

  try {
    // 1. Buscar pedido e produtos
    const order = await api.get(
      `http://orders-service:3002/order-service/v1/orders/${payment.orderId}`
    );
    const items = order.data.products;

    // 2. Verificar estoque
    for (const item of items) {
      const product = await api.get(`http://products-service:3001/products/${item.productId}`);
      if (product.data.stock < item.quantity) {
        await api.patch(
          `http://orders-service:3002/order-service/v1/orders/${payment.orderId}/status`,
          { status: "CANCELADO" }
        );
        await prisma.payment.update({ where: { id }, data: { status: PaymentStatus.CANCELADO } });
        return res.status(400).json({ error: "Estoque insuficiente" });
      }
      // precomputar newStock para usar no passo 3
      item.newStock = product.data.stock - item.quantity;
    }

    // 3. Atualizar estoque (agora com newStock válido)
    for (const item of items) {
      await api.patch(
        `http://products-service:3001/products/${item.productId}/estoque`,
        { stock: item.newStock }
      );
    }

    // 4. Simular gateway
    const success = Math.random() > 0.5;

    if (success) {
      await prisma.payment.update({ where: { id }, data: { status: "PAGO" } });
      await api.patch(
        `http://orders-service:3002/order-service/v1/orders/${payment.orderId}/status`,
        { status: "PAGO" }
      );

      // 🔔 Notificar cliente no users-service
      await api.post(
        `http://users-service:3004/users/${order.data.clientId}/notify`,
        {
          message: `✅ Pagamento do pedido #${payment.orderId} aprovado!`,
          orderId: payment.orderId,
          amount: payment.amount
        }
      );

      res.json({ message: "Pagamento aprovado e cliente notificado" });
    } else {
      await prisma.payment.update({ where: { id }, data: { status: "FALHA NO PAGAMENTO" } });
      await api.patch(
        `http://orders-service:3002/order-service/v1/orders/${payment.orderId}/status`,
        { status: "CANCELADO" }
      );

      // 🔔 Notificar cliente sobre falha
      await api.post(
        `http://users-service:3004/users/${order.data.clientId}/notify`,
        {
          message: `❌ Pagamento do pedido #${payment.orderId} falhou. Verifique os dados de pagamento.`,
          orderId: payment.orderId,
          amount: payment.amount
        }
      );

      res.json({ message: "Pagamento recusado e cliente notificado" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pagamento" });
  }
});

// Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.listen(3003, () => console.log("🚀 Payments service - porta 3003"));
