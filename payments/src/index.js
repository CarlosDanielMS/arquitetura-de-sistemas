import express from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import amqplib from "amqplib"; // Importa o amqplib

dotenv.config();
const app = express();
app.use(express.json());
const prisma = new PrismaClient();

// ============================================
// 🐇 Conexão RabbitMQ
// ============================================
const RABBIT_URL = process.env.RABBITMQ_URL || "amqp://user:password@rabbitmq:5672";
const QUEUE_NAME = "payment_notifications";
let channel; // Canal de comunicação com o RabbitMQ

/**
 * Tenta conectar ao RabbitMQ com retentativas (loop).
 * Só retorna (resolve) quando a conexão é bem-sucedida.
 */
async function connectRabbitMQ() {
  let attempts = 0;
  while (true) { // Loop infinito de retentativa
    try {
      attempts++;
      console.log(`Attempt ${attempts} to connect to RabbitMQ...`);
      
      const conn = await amqplib.connect(RABBIT_URL);

      // --- Adiciona listeners para saúde da conexão ---
      conn.on("error", (err) => {
        console.error("❌ RabbitMQ connection error", err.message);
        channel = null; // Invalida o canal
      });
      conn.on("close", () => {
        console.warn("RabbitMQ connection closed. Reconnecting...");
        channel = null;
        connectRabbitMQ(); // Tenta reconectar se a conexão cair
      });
      // ------------------------------------------------

      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      
      console.log("✅ Connected to RabbitMQ (Payments Producer)");
      return; // Sucesso, sai do loop e da função

    } catch (err) {
      console.error(`❌ Failed to connect to RabbitMQ (Attempt ${attempts}):`, err.message);
      if (attempts >= 10) { // Limite de 10 tentativas para evitar loop infinito no boot
         console.error("Max connection attempts reached. Exiting.");
         process.exit(1); // Falha o container (deixa o Docker reiniciar)
      }
      // Espera 5 segundos antes de tentar novamente
      console.log("Retrying RabbitMQ connection in 5s...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

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
      // 1. Confirma o pedido
      const orderRes = await axios.patch(`${process.env.ORDERS_SERVICE_URL}/orders/${payment.orderId}/confirm`);
      const order = orderRes.data; // O pedido agora contém customerName

      // ----------------------------------------------------------------
      // 🚀 ENVIAR EVENTO PARA RABBITMQ (PRODUCER)
      // ----------------------------------------------------------------
      if (channel) {
        
        // --- CORRIGIDO ---
        // Usamos os dados do pedido (order) que foi retornado
        const eventMessage = {
          nomeCliente: order.customerName, // <--- Dado real do pedido
          orderId: order._id,              // <--- ID real do pedido (Mongoose)
          status: "APPROVED"
        };
        // -----------------

        // Envia a mensagem para a fila como um Buffer
        channel.sendToQueue(
          QUEUE_NAME,
          Buffer.from(JSON.stringify(eventMessage)),
          { persistent: true } // Garante que a msg sobreviva a reinícios do RabbitMQ
        );
        console.log(`[x] Sent payment event for order ${payment.orderId}`);
      } else {
        console.error("❌ RabbitMQ channel not available. Message not sent.");
        // Isso não deve acontecer agora, mas é uma boa prática manter
        // Em um cenário real, poderíamos ter uma fila de "falha"
      }
      // ----------------------------------------------------------------

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

/**
 * Função de inicialização do servidor
 */
async function startServer() {
  // 1. Conecta ao RabbitMQ PRIMEIRO
  await connectRabbitMQ(); 

  // 2. SÓ ENTÃO inicia o servidor Express
  app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Payments service running on port ${process.env.PORT || 3000}`);
  });
}

// Inicia o processo
startServer();