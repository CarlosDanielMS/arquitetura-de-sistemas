const express = require("express");
const { PrismaClient } = require("@prisma/client");
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./swagger");

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// CRUD de clientes
app.get("/users", async (req, res) => {
  res.json(await prisma.user.findMany());
});

app.get("/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json(user);
});

app.post("/users", async (req, res) => {
  const user = await prisma.user.create({ data: req.body });
  res.status(201).json(user);
});

// Notificação de pagamento
app.post("/users/:id/notify", (req, res) => {
  const { id } = req.params;
  const { message, orderId, amount } = req.body;
  console.log(`📢 Cliente ${id}: ${message} | Pedido #${orderId} | R$${amount}`);
  res.json({ success: true, message: "Notificação entregue" });
});

// Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.listen(3004, () => console.log("🚀 Users service - porta 3004"));
