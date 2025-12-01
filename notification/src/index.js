<<<<<<< HEAD
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Kafka } from "kafkajs";
import client from "prom-client";
import express from "express";
=======
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import amqplib from "amqplib"; // Importa o amqplib
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e

dotenv.config();
const app = express();
app.use(express.json());
<<<<<<< HEAD

const prisma = new PrismaClient();
// kafka consumer
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

// nodemailer
=======
const prisma = new PrismaClient();

// ============================================
// 🐇 Conexão RabbitMQ (Consumer)
// ============================================
const RABBIT_URL = process.env.RABBITMQ_URL || "amqp://user:password@rabbitmq:5672";
const QUEUE_NAME = "payment_notifications";

/**
 * Conecta ao RabbitMQ e começa a consumir a fila de notificações.
 * Tenta reconectar em caso de falha.
 */
async function connectRabbitMQ() {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      console.log(`Attempt ${attempts} to connect to RabbitMQ (Consumer)...`);

      const conn = await amqplib.connect(RABBIT_URL);

      // --- Listeners de saúde ---
      conn.on("error", (err) => {
        console.error("❌ RabbitMQ connection error", err.message);
      });
      conn.on("close", () => {
        console.warn("RabbitMQ connection closed. Reconnecting...");
        setTimeout(connectRabbitMQ, 5000); // Tenta reconectar se a conexão cair
      });
      // --------------------------

      const channel = await conn.createChannel();
      
      // Garante que a fila exista e seja durável
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      
      console.log("✅ Connected to RabbitMQ (Notification Consumer)");
      console.log(`[*] Waiting for messages in ${QUEUE_NAME}.`);

      // Começa a consumir a fila
      channel.consume(QUEUE_NAME, (msg) => {
        if (msg !== null) {
          try {
            // Converte o Buffer de volta para string e depois para JSON
            const event = JSON.parse(msg.content.toString());

            // --------------------------------------------------
            // AÇÃO DO CONSUMIDOR (Simulação com Console.log)
            // --------------------------------------------------
            if (event.status === "APPROVED" && event.nomeCliente) {
              console.log("======================================================");
              console.log("📬 Notificação Recebida (RabbitMQ):");
              // Exibe a mensagem exata solicitada
              console.log(`   ${event.nomeCliente}, seu pedido ${event.orderId} foi PAGO com sucesso e será despachado em breve.`);
              console.log("======================================================");
            }
            // --------------------------------------------------

            // Confirma (ACK) que a mensagem foi processada com sucesso
            channel.ack(msg);

          } catch (e) {
            console.error("❌ Falha ao processar mensagem do RabbitMQ:", e.message);
            // Rejeita (NACK) a mensagem sem reenfileirar (false)
            channel.nack(msg, false, false);
          }
        }
      }, {
        noAck: false // Garante que o RabbitMQ espere a confirmação (ack)
      });

      return; // Sai do loop 'while' pois conectou com sucesso

    } catch (err) {
      console.error(`❌ Failed to connect to RabbitMQ consumer (Attempt ${attempts}):`, err.message);
      if (attempts >= 10) {
         console.error("Max connection attempts reached. Exiting.");
         process.exit(1); // Falha o container
      }
      console.log("Retrying RabbitMQ connection in 5s...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}


// Configuração do transport SMTP
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

<<<<<<< HEAD
// rotas
app.get("/", (req, res) => res.json({ message: "Notification service running" }));

=======
// Health check
app.get("/", (req, res) => res.json({ message: "🚀 Notification service running" }));

// ==============================
// Endpoint genérico de notificação (Pode ser mantido para outras comunicações)
// ==============================
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
app.post("/notify", async (req, res) => {
  try {
    const { type, recipient, subject, message } = req.body;

    if (!type || !recipient || !subject || !message)
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });

<<<<<<< HEAD
    console.log(`Enviando notificação para ${recipient}: ${subject}`);

=======
    // Envia o e-mail (simulado)
    console.log(`📨 [HTTP] Enviando notificação para ${recipient}: ${subject}`);

    // Simula envio real (em produção: await transporter.sendMail(...))
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
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

<<<<<<< HEAD
=======
// ==============================
// Histórico de notificações
// ==============================
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
app.get("/notifications", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    orderBy: { id: "desc" },
  });
  res.json(notifications);
});

<<<<<<< HEAD
// metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "notification_", timeout: 5000 });
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

app.listen(process.env.PORT || 3000, async () => {
  console.log(`Notification service running on port ${process.env.PORT || 3000}`);
  await initKafka();
});
=======
/**
 * Função de inicialização do servidor
 */
async function startServer() {
  // 1. Conecta ao RabbitMQ PRIMEIRO
  connectRabbitMQ(); // Não precisa de await aqui, pois o consumer pode rodar em paralelo

  // 2. Inicia o servidor Express (para endpoints / e /notifications)
  app.listen(process.env.PORT || 3000, () => {
    console.log(`✅ Notification service running on port ${process.env.PORT || 3000}`);
  });
}

// Inicia o processo
startServer();
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
