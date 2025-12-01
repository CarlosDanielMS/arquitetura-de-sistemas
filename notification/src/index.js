import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import amqplib from "amqplib";
import { Kafka } from "kafkajs";
import client from "prom-client";

dotenv.config();
const app = express();
app.use(express.json());
const prisma = new PrismaClient();

// ============================================
// 🐇 RabbitMQ Consumer
// ============================================
const RABBIT_URL = process.env.RABBITMQ_URL || "amqp://user:password@rabbitmq:5672";
const QUEUE_NAME = "payment_notifications";

async function connectRabbitMQ() {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      console.log(`Attempt ${attempts} to connect to RabbitMQ (Consumer)...`);

      const conn = await amqplib.connect(RABBIT_URL);

      conn.on("error", (err) => {
        console.error("❌ RabbitMQ connection error", err.message);
      });
      conn.on("close", () => {
        console.warn("RabbitMQ connection closed. Reconnecting...");
        setTimeout(connectRabbitMQ, 5000);
      });

      const channel = await conn.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      
      console.log("✅ Connected to RabbitMQ (Notification Consumer)");
      console.log(`[*] Waiting for messages in ${QUEUE_NAME}.`);

      channel.consume(QUEUE_NAME, async (msg) => {
        if (msg !== null) {
          try {
            const event = JSON.parse(msg.content.toString());

            if (event.status === "APPROVED" && event.nomeCliente) {
              console.log("======================================================");
              console.log("📬 Notificação Recebida (RabbitMQ):");
              console.log(`   ${event.nomeCliente}, seu pedido ${event.orderId} foi PAGO com sucesso e será despachado em breve.`);
              console.log("======================================================");

              // Salvar no banco
              await prisma.notification.create({
                data: {
                  type: "EMAIL",
                  recipient: event.nomeCliente,
                  subject: `Pedido ${event.orderId} aprovado`,
                  message: `Olá ${event.nomeCliente}, seu pedido ${event.orderId} foi confirmado.`,
                  status: "SENT",
                },
              });
            }

            channel.ack(msg);
          } catch (e) {
            console.error("❌ Falha ao processar mensagem do RabbitMQ:", e.message);
            channel.nack(msg, false, false);
          }
        }
      }, {
        noAck: false
      });

      return;

    } catch (err) {
      console.error(`❌ Failed to connect to RabbitMQ consumer (Attempt ${attempts}):`, err.message);
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
// 📨 Kafka Consumer
// ============================================
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "notification-service-group" });

async function initKafka() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "notifications-topic", fromBeginning: false });
    console.log("[KAFKA] Notification consumer conectado ao notifications-topic");

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const content = JSON.parse(message.value.toString());
          const { orderId, customerName } = content;

          console.log(
            `${customerName || "Cliente"}, seu pedido ${orderId} foi aprovado e será despachado em breve.`
          );

          await prisma.notification.create({
            data: {
              type: "EMAIL",
              recipient: customerName || "Cliente",
              subject: `Pedido ${orderId} aprovado`,
              message: `Olá ${customerName || "Cliente"}, seu pedido ${orderId} foi confirmado.`,
              status: "SENT",
            },
          });
        } catch (err) {
          console.error("[KAFKA] Erro ao processar mensagem:", err.message);
        }
      },
    });
  } catch (err) {
    console.error("[KAFKA] Falha ao conectar consumer:", err.message);
  }
}

// ============================================
// 📧 Nodemailer
// ============================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================
// 🚀 Rotas
// ============================================
app.get("/", (req, res) => res.json({ message: "🚀 Notification service running" }));

// Endpoint genérico de notificação
app.post("/notify", async (req, res) => {
  try {
    const { type, recipient, subject, message } = req.body;

    if (!type || !recipient || !subject || !message)
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });

    console.log(`📨 [HTTP] Enviando notificação para ${recipient}: ${subject}`);

    const notification = await prisma.notification.create({
      data: { type, recipient, subject, message },
    });

    res.status(201).json({
      message: "Notificação enviada com sucesso",
      notification,
    });
  } catch (err) {
    console.error("Erro ao enviar notificação:", err.message);
    res.status(500).json({ error: "Falha ao enviar notificação" });
  }
});

// Histórico de notificações
app.get("/notifications", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    orderBy: { id: "desc" },
  });
  res.json(notifications);
});

// Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "notification_", timeout: 5000 });
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// ============================================
// 🎬 Inicialização
// ============================================
async function startServer() {
  // Conecta ao RabbitMQ
  connectRabbitMQ();
  
  // Conecta ao Kafka
  await initKafka();

  // Inicia o servidor Express
  app.listen(process.env.PORT || 3000, () => {
    console.log(`✅ Notification service running on port ${process.env.PORT || 3000}`);
  });
}

startServer();
