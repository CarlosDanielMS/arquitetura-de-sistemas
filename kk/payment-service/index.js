const express = require('express');
const app = express();
const PORT = 3000;
const api = require("./config/axios");

app.use(express.json());

app.post('/payments/:id/process', async (req, res) => {
    const orderId = req.params.id;
    console.log(`[Pagamentos Service] Processo de pagamento iniciado para o pedido ${orderId}`);

    try {
        console.log('Buscando dados do pedido');
        const orderResponse = await api.get(`/orders/${orderId}`);
        const order = orderResponse.data;
        console.log(`Dados do pedido recebidos:`, order);

        console.log(`Processo de pagamento para o pedido ${orderId} finalizado com sucesso.`);
        res.status(200).json({ message: 'Pagamento aprovado e pedido atualizado!' });

    } catch (error) {
        console.error(`[Pagamentos Service] Erro no processo de pagamento para o pedido ${orderId}:`, error.message);
        res.status(400).json({ message: 'Ocorreu um erro interno no processamento do pagamento.', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`[Pagamentos Service] Rodando na porta ${PORT}`);
});