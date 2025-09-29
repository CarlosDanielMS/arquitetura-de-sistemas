const express = require("express");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./swagger");

const app = express();
app.use(express.json());

// Modelo MongoDB
const orderSchema = new mongoose.Schema({
  clientId: Number,
  products: [
    {
      productId: Number,
      quantity: Number
    }
  ],
  status: {
    type: String,
    enum: ["AGUARDANDO PAGAMENTO", "PAGO", "FALHA NO PAGAMENTO", "CANCELADO"],
    default: "AGUARDANDO PAGAMENTO"
  },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);

// CRUD de pedidos
app.post("/order-service/v1/orders", async (req, res) => {
  const order = await Order.create(req.body);
  res.status(201).json(order);
});

app.get("/order-service/v1/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  res.json(order);
});

app.get("/order-service/v1/orders", async (req, res) => {
  res.json(await Order.find());
});

// Atualizar status
app.patch("/order-service/v1/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  res.json(order);
});

// Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const MONGO_URL = process.env.MONGO_URL || "mongodb://orders-db:27017/orders";
mongoose.connect(MONGO_URL)
  .then(() => app.listen(3002, () => console.log("🚀 Orders service on 3002")))
  .catch(err => console.error("Erro ao conectar MongoDB:", err));

