const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let orders = [
    { id: "1", usuarioId: "user-123", status: "Aguardando Pagamento", valorTotal: 500, itens: [{ produtoId: "prod-abc", quantidade: 2 }] }
];

app.get('/orders/:id', (req, res) => {
    console.log(`[Pedidos Service] GET /orders/${req.params.id} requisitado.`);
    const order = orders.find(p => p.id === req.params.id);
    if (order) {
        res.status(200).json(order);
    } else {
        res.status(404).send('Pedido não encontrado.');
    }
});

app.listen(PORT, () => {
    console.log(`[Pedidos Service] Rodando na porta ${PORT}`);
});