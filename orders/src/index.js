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
// 📦 Criar pedido (Agora exige autenticação)
// ============================================
app.post("/orders", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const authHeader = req.headers.authorization;

    if (!productId || !quantity || quantity <= 0)
      return res.status(400).json({ error: "Campos inválidos" });
    
    // 1. Validar autenticação
    if (!authHeader)
      return res.status(401).json({ error: "Token de autorização ausente" });

    let userData;
    try {
      // 2. Buscar dados do usuário no serviço USERS
      const userRes = await axios.get(`${process.env.USERS_SERVICE_URL}/me`, {
        headers: { Authorization: authHeader },
      });
      userData = userRes.data; // { id, name, email }
    } catch (err) {
      console.error("Erro ao autenticar usuário:", err.message);
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    // 3. Buscar produto
    const productRes = await axios.get(`${process.env.PRODUCTS_SERVICE_URL}/products/${productId}`);
    const product = productRes.data;
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });

    // 4. Verificar estoque
    if (product.stock < quantity)
      return res.status(400).json({ error: "Estoque insuficiente" });

    // Calcular total
    const totalPrice = product.price * quantity;

    // 5. Criar pedido (salvando dados do cliente)
    const order = await Order.create({
      productId,
      quantity,
      totalPrice,
      status: "PENDING",
      userId: userData.id,
      customerName: userData.name,
      customerEmail: userData.email,
    });

    // 6. Atualizar estoque
    await axios.patch(`${process.env.PRODUCTS_SERVICE_URL}/products/${productId}/stock`, {
      amount: -quantity,
    });

    // 7. Remover notificação HTTP (agora é assíncrona via RabbitMQ)
    // await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notify`, { ... });

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err.message);
    if (err.response?.status === 404)
      return res.status(404).json({ error: "Produto não encontrado" });
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

  // Remover notificação HTTP
  // await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notify`, { ... });

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

  // Remover notificação HTTP
  // await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notify`, { ... });

  res.json(order);
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Orders service running on port ${process.env.PORT || 3000}`)
);