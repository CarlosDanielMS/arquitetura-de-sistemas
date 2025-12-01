import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Kafka } from "kafkajs";
import client from "prom-client";
import express from "express";

dotenv.config();
const app = express();
app.use(express.json());

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
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// rotas
app.get("/", (req, res) => res.json({ message: "Notification service running" }));

app.post("/notify", async (req, res) => {
  try {
    const { type, recipient, subject, message } = req.body;

    if (!type || !recipient || !subject || !message)
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });

    console.log(`Enviando notificação para ${recipient}: ${subject}`);

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

app.get("/notifications", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    orderBy: { id: "desc" },
  });
  res.json(notifications);
});

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
