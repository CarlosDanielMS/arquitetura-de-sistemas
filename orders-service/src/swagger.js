module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Orders Service API",
    version: "1.0.0",
    description:
      "API de Pedidos: criação, consulta e atualização de status."
  },
  servers: [
    { url: "http://localhost:3002", description: "Local" },
    { url: "http://orders-service:3002", description: "Docker network" }
  ],
  tags: [{ name: "Orders", description: "Operações de pedidos" }],
  paths: {
    "/order-service/v1/orders": {
      get: {
        tags: ["Orders"],
        summary: "Listar pedidos",
        operationId: "listOrders",
        responses: {
          200: {
            description: "Lista de pedidos",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Order" } }
              }
            }
          }
        }
      },
      post: {
        tags: ["Orders"],
        summary: "Criar pedido",
        operationId: "createOrder",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderCreate" },
              example: {
                clientId: 1,
                products: [
                  { productId: 101, quantity: 2 },
                  { productId: 202, quantity: 1 }
                ]
              }
            }
          }
        },
        responses: {
          201: {
            description: "Pedido criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Order" }
              }
            }
          },
          400: { description: "Payload inválido" }
        }
      }
    },

    "/order-service/v1/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Obter pedido por ID",
        operationId: "getOrderById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID do pedido (Mongo ObjectId)",
            schema: { type: "string", example: "65f0c7f2a1b2c3d4e5f67890" }
          }
        ],
        responses: {
          200: {
            description: "Pedido encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Order" }
              }
            }
          },
          404: { description: "Pedido não encontrado" }
        }
      }
    },

    "/order-service/v1/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Atualizar status do pedido",
        operationId: "updateOrderStatus",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID do pedido (Mongo ObjectId)",
            schema: { type: "string", example: "65f0c7f2a1b2c3d4e5f67890" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderStatusUpdate" },
              example: { status: "PAGO" }
            }
          }
        },
        responses: {
          200: {
            description: "Status atualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Order" }
              }
            }
          },
          400: { description: "Status inválido" },
          404: { description: "Pedido não encontrado" }
        }
      }
    }
  },

  components: {
    schemas: {
      Order: {
        type: "object",
        properties: {
          _id: { type: "string", description: "Mongo ObjectId" },
          clientId: { type: "integer" },
          products: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" }
          },
          status: { $ref: "#/components/schemas/OrderStatus" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      OrderCreate: {
        type: "object",
        required: ["clientId", "products"],
        properties: {
          clientId: { type: "integer", example: 1 },
          products: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/OrderItem" }
          }
        }
      },
      OrderItem: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "integer", example: 101 },
          quantity: { type: "integer", minimum: 1, example: 2 }
        }
      },
      OrderStatus: {
        type: "string",
        enum: [
          "AGUARDANDO PAGAMENTO",
          "PAGO",
          "FALHA NO PAGAMENTO",
          "CANCELADO"
        ],
        example: "AGUARDANDO PAGAMENTO"
      },
      OrderStatusUpdate: {
        type: "object",
        required: ["status"],
        properties: {
          status: { $ref: "#/components/schemas/OrderStatus" }
        }
      }
    }
  }
};
