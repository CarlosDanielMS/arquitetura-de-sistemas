const express = require('express');
const { swaggerUiMiddleware, swaggerJsonHandler } = require('./swagger');

const app = express();
app.use(express.json());

app.use('/docs', swaggerUiMiddleware);
app.get('/api-docs.json', swaggerJsonHandler);

const productsRoutes = require('./src/routes/productsRoutes');
const ordersRoutes = require('./src/routes/ordersRoutes');
const customersRoutes = require('./src/routes/customersRoutes'); // Importa as novas rotas

app.use('/produtos', productsRoutes);
app.use('/pedidos', ordersRoutes);
app.use('/clientes', customersRoutes); // Registra as novas rotas

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API G1 running at http://localhost:${PORT} — docs: /docs`));