<<<<<<< HEAD
import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import cache from "../cache.js";
import client from "prom-client";
=======

import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e

dotenv.config();

const app = express();
app.use(express.json());
<<<<<<< HEAD
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

// metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "users_", timeout: 5000 });
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// rotas
app.get("/", (req, res) =>
  res.json({ message: "Users service running <3" })
);

app.post("/", (req, res) => {
  res.status(200).send("OK");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email)
      return res.status(400).json({ error: "Preencha todos os campos" });

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser)
      return res.status(409).json({ error: "E-mail já cadastrado" });

    const user = await prisma.user.create({
      data: { name, email },
=======
const prisma = new PrismaClient();

// 🩵 Health check
app.get("/", (req, res) =>
  res.json({ message: "🚀 Users service running" })
);

// ==============================
// 🧾 Registro de usuário
// ==============================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Preencha todos os campos" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(409).json({ error: "E-mail já cadastrado" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err.message);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

<<<<<<< HEAD
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    console.error("Erro ao listar usuários:", err.message);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// buscar user por id com cache de 1 dia
app.get("/users/:id", cache(86400), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
=======
// ==============================
// 🔐 Login (gera JWT)
// ==============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(401).json({ error: "Credenciais inválidas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRATION }
    );

    res.json({
      message: "Login bem-sucedido",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err.message);
    res.status(500).json({ error: "Erro no login" });
  }
});

// ==============================
// 🧠 Middleware de autenticação
// ==============================
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Token ausente" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// ==============================
// 👤 Rota protegida /me
// ==============================
app.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user)
      return res.status(404).json({ error: "Usuário não encontrado" });

>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
    res.json(user);
  } catch (err) {
    console.error("Erro ao buscar usuário:", err.message);
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

<<<<<<< HEAD
app.delete("/users/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    await prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: `Usuário ${user.name} deletado com sucesso.` });
  } catch (err) {
    console.error("Erro ao deletar usuário:", err.message);
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

=======
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
app.listen(process.env.PORT || 3000, () =>
  console.log(`Users service running on port ${process.env.PORT || 3000}`)
);
