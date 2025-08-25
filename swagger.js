// swagger.js
// Responsável por gerar o spec OpenAPI e expor o middleware do Swagger UI

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Opções do OpenAPI (descrição, schemas e paths)
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'G1 E-commerce API',
      version: '1.0.0',
      description: 'API em memória para Produtos e Pedidos (G1)'
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Teclado Mecanico' },
            price: { type: 'number', example: 250.0 },
            stock: { type: 'integer', example: 10 }
          },
          required: ['id', 'name', 'price', 'stock']
        },
        ProductCreate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' }
          },
          required: ['name', 'price', 'stock']
        },
        ProductUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            productId: { type: 'integer', example: 1 },
            quantity: { type: 'integer', example: 2 },
            unitPrice: { type: 'number', example: 250.0 },
            subtotal: { type: 'number', example: 500.0 }
          },
          required: ['productId', 'quantity', 'unitPrice', 'subtotal']
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            total: { type: 'number', example: 650.0 },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'items', 'total', 'createdAt']
        },
        OrderCreate: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'integer', example: 1 },
                  quantity: { type: 'integer', example: 2 }
                },
                required: ['productId', 'quantity']
              }
            }
          },
          required: ['items']
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            details: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    paths: {
      '/products': {
        get: {
          summary: 'List all products',
          tags: ['Products'],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new product',
          tags: ['Products'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductCreate' } } }
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          }
        }
      },
      '/products/{id}': {
        get: {
          summary: 'Get product by ID',
          tags: ['Products'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          }
        },
        put: {
          summary: 'Update a product (partial)',
          tags: ['Products'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductUpdate' } } }
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          }
        }
      },
      '/orders': {
        get: {
          summary: 'List all orders',
          tags: ['Orders'],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new order (checks stock and decrements)',
          tags: ['Orders'],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderCreate' } } }
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
            400: { description: 'Insufficient stock or invalid payload', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          }
        }
      }
    }
  },
  apis: [] // estamos definindo tudo aqui, sem JSDoc nas rotas
};

// Gera o spec OpenAPI
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware pronto para montar em /docs
const swaggerUiMiddleware = [swaggerUi.serve, swaggerUi.setup(swaggerSpec)];

// Handler para servir o JSON do spec
function swaggerJsonHandler(req, res) {
  res.json(swaggerSpec);
}

module.exports = {
  swaggerUiMiddleware,
  swaggerJsonHandler,
};
