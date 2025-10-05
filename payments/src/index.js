import express from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
const prisma = new PrismaClient();

// Health Check
app.get("/", (req, res) => res.json({ message: "🚀 Payments service running" }));

// ============================================
// Criar pagamento pendente
// ============================================
app.post("/payments", async (req, res) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId || !method)
      return res.status(400).json({ error: "Campos inválidos" });

    // Buscar pedido no serviço orders
    const orderRes = await axios.get(`${process.env.ORDERS_SERVICE_URL}/orders/${orderId}`);
    const order = orderRes.data;

    if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
    if (order.status !== "PENDING")
      return res.status(400).json({ error: "Pedido já processado" });

    // Criar pagamento PENDENTE
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: order.totalPrice,
        method,
        status: "PENDING",
      },
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error("❌ Error creating payment:", err.message);
    if (err.response?.status === 404)
      return res.status(404).json({ error: "Pedido não encontrado" });
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// ============================================
// Processar pagamento (simulação)
// ============================================
app.post("/payments/:id/process", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment) return res.status(404).json({ error: "Pagamento não encontrado" });
    if (payment.status !== "PENDING")
      return res.status(400).json({ error: "Pagamento já processado" });

    // Simular resultado (70% de chance de aprovação)
    const approved = Math.random() < 0.7;
    const newStatus = approved ? "APPROVED" : "DECLINED";

    // Atualizar pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status: newStatus },
    });

    // Atualizar pedido de acordo com o resultado
    if (approved) {
      await axios.patch(`${process.env.ORDERS_SERVICE_URL}/orders/${payment.orderId}/confirm`);

      // Notificação: pagamento aprovado
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notify`, {
        type: "PAYMENT",
        recipient: "financeiro@teste.com",
        subject: "Pagamento aprovado ✅",
        message: `O pagamento do pedido ${payment.orderId} foi aprovado e confirmado com sucesso.`,
      });
    } else {
      await axios.patch(`${process.env.ORDERS_SERVICE_URL}/orders/${payment.orderId}/cancel`);

      // Notificação: pagamento recusado
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notify`, {
        type: "PAYMENT",
        recipient: "financeiro@teste.com",
        subject: "Pagamento recusado ❌",
        message: `O pagamento do pedido ${payment.orderId} foi recusado. O pedido foi cancelado.`,
      });
    }

    res.json({
      message: approved
        ? "✅ Pagamento aprovado e pedido confirmado"
        : "❌ Pagamento recusado, pedido cancelado",
      payment: updatedPayment,
    });
  } catch (err) {
    console.error("Error processing payment:", err.message);
    res.status(500).json({ error: "Erro ao processar pagamento" });
  }
});

// ============================================
// Listar pagamentos
// ============================================
app.get("/payments", async (req, res) => {
  const payments = await prisma.payment.findMany({ orderBy: { id: "desc" } });
  res.json(payments);
});

// Buscar pagamento por ID
app.get("/payments/:id", async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!payment) return res.status(404).json({ error: "Pagamento não encontrado" });
  res.json(payment);
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Payments service running on port ${process.env.PORT || 3000}`)
);
