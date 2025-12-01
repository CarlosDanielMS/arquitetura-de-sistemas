import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import { Order } from "../models/Order.js";
import { Kafka } from "kafkajs";
import cache from "../cache.js";
import client from "prom-client";

dotenv.config();

const app = express();
app.use(express.json());

// Kafka
const kafka = new Kafka({
  clientId: "orders-service",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();

async function initKafka() {
  try {
    await producer.connect();
    console.log("Orders conectado ao Kafka (producer)");
  } catch (err) {
    console.error("Erro ao conectar ao Kafka:", err.message);
  }
}
initKafka();

// Conexão MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB (orders_db)"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Health check
app.get("/", (req, res) =>
  res.json({ message: "Orders service running" })
);

// Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "orders_", timeout: 5000 });
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// Criar pedido (com autenticação)
app.post("/orders", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const authHeader = req.headers.authorization;

    if (!productId || !quantity || quantity <= 0)
      return res.status(400).json({ error: "Campos inválidos" });
    
    // Validar autenticação
    if (!authHeader)
      return res.status(401).json({ error: "Token de autorização ausente" });

    let userData;
    try {
      // Buscar dados do usuário no serviço USERS
      const userRes = await axios.get(`${process.env.USERS_SERVICE_URL}/me`, {
        headers: { Authorization: authHeader },
      });
      userData = userRes.data;
    } catch (err) {
      console.error("Erro ao autenticar usuário:", err.message);
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

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
      userId: userData.id,
      customerName: userData.name,
      customerEmail: userData.email,
    });

    // Atualizar estoque
    await axios.patch(`${process.env.PRODUCTS_SERVICE_URL}/products/${productId}/stock`, {
      amount: -quantity,
    });

    // Enviar para Kafka
    await producer.send({
      topic: "orders-topic",
      messages: [
        {
          value: JSON.stringify({
            orderId: order._id.toString(),
            userId: userData.id,
            productId,
            quantity,
            totalPrice,
          }),
        },
      ],
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err.message);
    if (err.response?.status === 404)
      return res.status(404).json({ error: "Produto não encontrado" });
    res.status(500).json({ error: "Erro ao criar pedido" });
  }
});

// Listar pedidos
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err.message);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

// Buscar pedido por ID (com cache de 30 dias)
app.get("/orders/:id", cache(2592000), async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: "ID inválido" });

  const order = await Order.findById(id);

  if (!order)
    return res.status(404).json({ error: "Pedido não encontrado" });

  res.json(order);
});

// Confirmar pedido
app.patch("/orders/:id/confirm", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  if (order.status !== "PENDING")
    return res.status(400).json({ error: "Apenas pedidos pendentes podem ser confirmados" });

  order.status = "APPROVED";
  await order.save();

  res.json(order);
});

// Cancelar pedido
app.patch("/orders/:id/cancel", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

  if (order.status === "CANCELLED")
    return res.status(400).json({ error: "Pedido já cancelado" });

  // Repor estoque se ainda estiver pendente
  if (order.status === "PENDING") {
    await axios.patch(`${process.env.PRODUCTS_SERVICE_URL}/products/${order.productId}/stock`, {
      amount: order.quantity,
    });
  }

  order.status = "CANCELLED";
  await order.save();

  res.json(order);
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Orders service running on port ${process.env.PORT || 3000}`)
);
