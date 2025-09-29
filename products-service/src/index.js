const express = require("express");
const { PrismaClient } = require("@prisma/client");
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./swagger");

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Listar produtos
app.get("/products", async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

// Buscar produto por ID
app.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  res.json(product);
});

// Criar produto
app.post("/products", async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        name: req.body.name,
        price: req.body.price,
        stock: req.body.stock
      }
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// Atualizar produto (sem mexer no estoque!)
app.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price } = req.body; // só nome e preço permitidos

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { name, price }
    });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Produto não encontrado" });
  }
});

// Atualizar estoque (endpoint específico)
app.patch("/products/:id/estoque", async (req, res) => {
  const id = parseInt(req.params.id);
  const { stock } = req.body;

  if (typeof stock !== "number" || stock < 0) {
    return res.status(400).json({ error: "Estoque inválido" });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { stock }
    });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Produto não encontrado" });
  }
});

// Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.listen(3001, () => console.log("🚀 Products service - porta 3001"));
