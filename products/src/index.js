import express from "express";
import { PrismaClient } from "@prisma/client";
<<<<<<< HEAD
import dotenv from "dotenv";
import cache from "../cache.js";
import client from "prom-client";

dotenv.config();

const app = express();
app.use(express.json());
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

// metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "products_", timeout: 5000 });
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// rotas
app.get("/", (req, res) =>
  res.json({ message: "Products service running <3" })
);

app.post("/", (req, res) => {
  res.status(200).send("OK");
});

// listar todos com cache 4h
app.get("/products", cache(14400), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (err) {
    console.error("Erro ao listar produtos:", err.message);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!product)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.json(product);
  } catch (err) {
    console.error("Erro ao buscar produto:", err.message);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

app.post("/products", async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    const existing = await prisma.product.findUnique({ where: { name } });

=======

const app = express();
app.use(express.json());
const prisma = new PrismaClient();

// =============== MIDDLEWARE DE ERROS ==================
const errorHandler = (err, req, res, next) => {
  console.error("❌ Erro:", err.message);
  res.status(500).json({ error: "Erro interno no servidor" });
};

// =============== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.json({ message: "Service is running" });
});

// =============== LISTAR TODOS ==================
app.get("/products", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// =============== BUSCAR POR ID ==================
app.get("/products/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });

    res.json(product);
  } catch (err) {
    next(err);
  }
});

// =============== CRIAR PRODUTO ==================
app.post("/products", async (req, res, next) => {
  try {
    const { name, description, price, stock } = req.body;

    // Validações
    if (!name || typeof name !== "string" || name.trim() === "")
      return res.status(400).json({ error: "Nome do produto é obrigatório" });

    if (price == null || isNaN(price) || price <= 0)
      return res.status(400).json({ error: "Preço deve ser maior que 0" });

    if (stock != null && (isNaN(stock) || stock < 0))
      return res.status(400).json({ error: "Estoque não pode ser negativo" });

    // 🔍 Verificar duplicidade de nome
    const existing = await prisma.product.findUnique({ where: { name } });
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
    if (existing)
      return res.status(409).json({ error: "Já existe um produto com esse nome" });

    const product = await prisma.product.create({
<<<<<<< HEAD
      data: { name, description, price, stock },
=======
      data: { name, description, price: parseFloat(price), stock: stock || 0 },
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
    });

    res.status(201).json(product);
  } catch (err) {
<<<<<<< HEAD
    console.error("Erro ao criar produto:", err.message);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

app.patch("/products/:id/stock", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { quantity } = req.body;

    if (!quantity || quantity <= 0)
      return res.status(400).json({ error: "Quantidade inválida" });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product)
      return res.status(404).json({ error: "Produto não encontrado" });

    if (product.stock < quantity)
      return res
        .status(400)
        .json({ error: "Estoque insuficiente" });

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: product.stock - quantity },
    });

    res.json({ message: "Estoque atualizado com sucesso", product: updated });
  } catch (err) {
    console.error("Erro ao atualizar estoque:", err.message);
    res.status(500).json({ error: "Erro ao atualizar estoque" });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!product)
      return res.status(404).json({ error: "Produto não encontrado" });

    await prisma.product.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: `Produto ${product.name} deletado com sucesso.` });
  } catch (err) {
    console.error("Erro ao deletar produto:", err.message);
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

=======
    next(err);
  }
});

// =============== ATUALIZAR PRODUTO ==================
app.put("/products/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, stock } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });

    // Validações
    if (price != null && (isNaN(price) || price <= 0))
      return res.status(400).json({ error: "Preço deve ser maior que 0" });

    if (stock != null && (isNaN(stock) || stock < 0))
      return res.status(400).json({ error: "Estoque não pode ser negativo" });

    if (name) {
      const existing = await prisma.product.findUnique({ where: { name } });
      if (existing && existing.id !== id)
        return res.status(409).json({ error: "Nome já usado por outro produto" });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        stock: stock ?? undefined,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// =============== ATUALIZAR ESTOQUE ==================
app.patch("/products/:id/stock", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { amount } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    if (amount == null || isNaN(amount))
      return res.status(400).json({ error: "Quantidade inválida" });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });

    const newStock = product.stock + amount;

    if (newStock < 0)
      return res.status(400).json({ error: "Estoque insuficiente para essa operação" });

    const updated = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// =============== DELETAR PRODUTO ==================
app.delete("/products/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    await prisma.product.delete({ where: { id } });
    res.json({ message: "Produto removido com sucesso" });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ error: "Produto não encontrado" });
    next(err);
  }
});

// =============== ERRO GLOBAL ==================
app.use(errorHandler);

>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
app.listen(process.env.PORT || 3000, () =>
  console.log(`Products service running on port ${process.env.PORT || 3000}`)
);
