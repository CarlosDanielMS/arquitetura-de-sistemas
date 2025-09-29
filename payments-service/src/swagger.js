module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Payments Service API",
    version: "1.0.0",
    description: "API de Pagamentos: criação e processamento de pagamentos."
  },
  servers: [
    { url: "http://localhost:3003", description: "Local" },
    { url: "http://payments-service:3003", description: "Docker network" }
  ],
  tags: [{ name: "Payments", description: "Operações de pagamento" }],
  paths: {
    "/payments": {
      post: {
        tags: ["Payments"],
        summary: "Criar pagamento",
        operationId: "createPayment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaymentCreate" },
              example: {
                orderId: "65f0c7f2a1b2c3d4e5f67890",
                status: "AGUARDANDO PAGAMENTO"
              }
            }
          }
        },
        responses: {
          201: {
            description: "Pagamento criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Payment" }
              }
            }
          },
          400: { description: "Payload inválido" }
        }
      }
    },

    "/payments/{id}/process": {
      patch: {
        tags: ["Payments"],
        summary: "Processar pagamento (aprovar/reprovar)",
        operationId: "processPayment",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID do pagamento",
            schema: { type: "string", example: "pay_01HXYZABC123" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaymentProcessUpdate" },
              examples: {
                aprovado: { value: { status: "PAGO" } },
                falha: { value: { status: "FALHA NO PAGAMENTO" } }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Pagamento processado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Payment" }
              }
            }
          },
          400: { description: "Status inválido" },
          404: { description: "Pagamento não encontrado" }
        }
      }
    }
  },

  components: {
    schemas: {
      Payment: {
        type: "object",
        properties: {
          id: { type: "string", description: "Identificador do pagamento" },
          orderId: {
            type: "string",
            description: "ID do pedido relacionado (ObjectId do Orders)"
          },
          status: { $ref: "#/components/schemas/PaymentStatus" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      PaymentCreate: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: {
            type: "string",
            description: "ID do pedido relacionado (ObjectId do Orders)",
            example: "65f0c7f2a1b2c3d4e5f67890"
          },
          status: {
            $ref: "#/components/schemas/PaymentStatus",
            description:
              "Opcional na criação; se omitido, assume 'AGUARDANDO PAGAMENTO'"
          }
        }
      },
      PaymentProcessUpdate: {
        type: "object",
        required: ["status"],
        properties: {
          status: { $ref: "#/components/schemas/PaymentStatus" }
        }
      },
      PaymentStatus: {
        type: "string",
        enum: [
          "AGUARDANDO PAGAMENTO",
          "PAGO",
          "FALHA NO PAGAMENTO",
          "CANCELADO"
        ],
        example: "AGUARDANDO PAGAMENTO"
      }
    }
  }
};
