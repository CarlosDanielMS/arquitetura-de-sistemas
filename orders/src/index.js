import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import { Order } from "../models/Order.js";

dotenv.config();
const app = express();
app.use(express.json());

// Conexão MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB (orders_db)"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 🩵 Health check
app.get("/", (req, res) => res.json({ message: "Orders service running" }));

// ============================================
// 📦 Criar pedido
// ============================================
app.post("/orders", async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0)
      return res.status(400).json({ error: "Campos inválidos" });

    // Buscar produto
    const productRes = await axios.get(`${process.env.PRODUCTS_SERVICE_URL}/products/${productId}`);
    const product = productRes.data;
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });

    // Verificar estoque
    if (product.stock < quantity)
      return res.status(400).json({ error: "Estoque insuficiente" });

    // Calcular total
    const totalPrice = product.price * quantity;

    // Criar pedido
    const order = await Order.create({
      productId,
      quantity,
      totalPrice,
      status: "PENDING",
    });

    // 5️⃣ Atualizar estoque
    await axios.patch(`${process.env.PRODUCTS_SERVICE_URL}/products/${productId}/stock`, {
      amount: -quantity,
    });

    // 6️⃣ Notificação: pedido criado
    await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notify`, {
      type: "ORDER",
      recipient: "cliente@teste.com",
      subject: "Pedido criado 🛒",
      message: `O pedido ${order.id} foi criado com sucesso. Valor total: R$ ${totalPrice.toFixed(2)}.`,
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err.message);
    res.status(500).json({ error: "Erro ao criar pedido" });
  }
});

// ============================================
// 📋 Listar pedidos
// ============================================
app.get("/orders", async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// 🔍 Buscar pedido por ID
app.get("/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  res.json(order);
});

// ============================================
// 🟢 Confirmar pedido
// ============================================
app.patch("/orders/:id/confirm", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  if (order.status !== "PENDING")
    return res.status(400).json({ error: "Apenas pedidos pendentes podem ser confirmados" });

  order.status = "APPROVED";
  await order.save();

  // Notificação: pedido confirmado
  await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notify`, {
    type: "ORDER",
    recipient: "cliente@teste.com",
    subject: "Pedido confirmado ✅",
    message: `Seu pedido ${order.id} foi confirmado e está em preparação.`,
  });

  res.json(order);
});

// ============================================
// 🔴 Cancelar pedido
// ============================================
app.patch("/orders/:id/cancel", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

  if (order.status === "CANCELLED")
    return res.status(400).json({ error: "Pedido já cancelado" });

  // 🔁 Repor estoque se ainda estiver pendente
  if (order.status === "PENDING") {
    await axios.patch(`${process.env.PRODUCTS_SERVICE_URL}/products/${order.productId}/stock`, {
      amount: order.quantity,
    });
  }

  order.status = "CANCELLED";
  await order.save();

  // Notificação: pedido cancelado
  await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notify`, {
    type: "ORDER",
    recipient: "cliente@teste.com",
    subject: "Pedido cancelado ❌",
    message: `Seu pedido ${order.id} foi cancelado.`,
  });

  res.json(order);
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Orders service running on port ${process.env.PORT || 3000}`)
);
