// index.js (CommonJS)
// Execução: npm i express swagger-ui-express swagger-jsdoc && node index.js

const express = require('express');
const { swaggerUiMiddleware, swaggerJsonHandler } = require('./swagger');

// Cria a instância do Express e habilita JSON no body
const app = express();
app.use(express.json());

// Swagger UI e JSON (montado antes das rotas para ficar sempre disponível)
app.use('/docs', swaggerUiMiddleware);
app.get('/api-docs.json', swaggerJsonHandler);

// Importa rotas (cada rota chama seu controller)
const productsRoutes = require('./src/routes/productsRoutes');
const ordersRoutes = require('./src/routes/ordersRoutes');

// Monta as rotas na aplicação
app.use('/produtos', productsRoutes); // /produtos, /produtos/:id
app.use('/pedidos', ordersRoutes);    // /pedidos

// Middleware 404 (pega qualquer rota não mapeada)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Sobe o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API G1 running at http://localhost:${PORT} — docs: /docs`));
