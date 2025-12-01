import express from "express";
import axios from "axios";
import { PrismaClient, PaymentStatus } from "@prisma/client";
import dotenv from "dotenv";
import amqplib from "amqplib";
import { Kafka } from "kafkajs";
import cache from "../cache.js";
import client from "prom-client";

dotenv.config();
const app = express();
app.use(express.json());
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ============================================
// 🐇 RabbitMQ Connection
// ============================================
const RABBIT_URL = process.env.RABBITMQ_URL || "amqp://user:password@rabbitmq:5672";
const QUEUE_NAME = "payment_notifications";
let channel;

async function connectRabbitMQ() {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      console.log(`Attempt ${attempts} to connect to RabbitMQ...`);
      
      const conn = await amqplib.connect(RABBIT_URL);

      conn.on("error", (err) => {
        console.error("❌ RabbitMQ connection error", err.message);
        channel = null;
      });
      conn.on("close", () => {
        console.warn("RabbitMQ connection closed. Reconnecting...");
        channel = null;
        connectRabbitMQ();
      });

      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      
      console.log("✅ Connected to RabbitMQ (Payments Producer)");
      return;

    } catch (err) {
      console.error(`❌ Failed to connect to RabbitMQ (Attempt ${attempts}):`, err.message);
      if (attempts >= 10) {
         console.error("Max connection attempts reached. Exiting.");
         process.exit(1);
      }
      console.log("Retrying RabbitMQ connection in 5s...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// ============================================
// 📨 Kafka Setup
// ============================================
const kafka = new Kafka({
  clientId: "payment-service",
  brokers: ["kafka:9092"],
  retry: { retries: 10 },
});

const consumer = kafka.consumer({
  groupId: "payment-service-group",
});

const producer = kafka.producer();

async function initKafkaConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "orders-topic", fromBeginning: false });

    console.log("[KAFKA] Conectado ao tópico orders-topic");

    await producer.connect();

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          console.log("[KAFKA] Mensagem recebida:", payload);

          const orderId = String(payload.orderId);
          if (!orderId) return;

          let userName = "Cliente";
          try {
            const userResponse = await axios.get(
              `http://users:3000/users/${payload.userId}`
            );
            userName = userResponse.data.name;
          } catch (err) {
            console.error("[PAYMENTS] Falha ao buscar usuário:", err.message);
          }

          const saved = await prisma.payment.create({
            data: {
              orderId,
              amount: Number(payload.totalPrice),
              method: "AUTO",
              status: PaymentStatus.PENDING,
            },
          });

          console.log(`[KAFKA] Pagamento criado (PENDING) orderId=${orderId}`);

          await producer.send({
            topic: "notifications-topic",
            messages: [
              {
                value: JSON.stringify({ orderId, customerName: userName }),
              },
            ],
          });

          console.log(
            `[KAFKA] Evento enviado para notifications-topic: { orderId: ${orderId}, customerName: ${userName} }`
          );
        } catch (err) {
          console.error("[KAFKA] Erro processando mensagem:", err.message);
        }
      },
    });
  } catch (err) {
    console.error("[KAFKA] Falha ao iniciar consumer:", err.message);
  }
}

// ============================================
// 🚀 Routes
// ============================================
app.get("/", (req, res) => {
  res.json({ message: "🚀 Payments service running" });
});

app.post("/", (req, res) => {
  res.status(200).send("OK");
});

// Criar pagamento pendente
app.post("/payments", async (req, res) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId || !method)
      return res.status(400).json({ error: "Campos inválidos" });

    const orderRes = await axios.get(`${process.env.ORDERS_SERVICE_URL}/orders/${orderId}`);
    const order = orderRes.data;

    if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
    if (order.status !== "PENDING")
      return res.status(400).json({ error: "Pedido já processado" });

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

// Processar pagamento (simulação)
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

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status: newStatus },
    });

    if (approved) {
      const orderRes = await axios.patch(`${process.env.ORDERS_SERVICE_URL}/orders/${payment.orderId}/confirm`);
      const order = orderRes.data;

      // Enviar para RabbitMQ
      if (channel) {
        const eventMessage = {
          nomeCliente: order.customerName,
          orderId: order._id,
          status: "APPROVED"
        };

        channel.sendToQueue(
          QUEUE_NAME,
          Buffer.from(JSON.stringify(eventMessage)),
          { persistent: true }
        );
        console.log(`[x] Sent payment event for order ${payment.orderId}`);
      } else {
        console.error("❌ RabbitMQ channel not available. Message not sent.");
      }

    } else {
      await axios.patch(`${process.env.ORDERS_SERVICE_URL}/orders/${payment.orderId}/cancel`);
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

// Listar pagamentos
app.get("/payments", async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { id: "desc" },
    });
    res.json(payments);
  } catch {
    res.status(500).json({ error: "Erro ao buscar pagamentos" });
  }
});

// Get types com cache infinito
app.get("/payments/types", cache(Infinity), (req, res) => {
  res.json(["CREDIT_CARD", "PIX", "BOLETO"]);
});

// Buscar pagamento por ID
app.get("/payments/:id", async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!payment)
      return res.status(404).json({ error: "Pagamento não encontrado" });

    res.json(payment);
  } catch {
    res.status(500).json({ error: "Erro ao buscar pagamento" });
  }
});

// Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "payments_", timeout: 5000 });
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// ============================================
// 🎬 Server Initialization
// ============================================
async function startServer() {
  // Conectar ao RabbitMQ
  await connectRabbitMQ();
  
  // Iniciar Kafka Consumer
  await initKafkaConsumer();

  // Iniciar servidor Express
  app.listen(PORT, () => {
    console.log(`🚀 Payment service running on port ${PORT}`);
  });
}

startServer();
