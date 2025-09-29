module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Users Service API",
    version: "1.0.0",
    description: "API de Usuários: CRUD básico e notificação."
  },
  servers: [
    { url: "http://localhost:3004", description: "Local" },
    { url: "http://users-service:3004", description: "Docker network" }
  ],
  tags: [{ name: "Users", description: "Operações de usuários" }],
  paths: {
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Listar usuários",
        operationId: "listUsers",
        responses: {
          200: {
            description: "Lista de usuários",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } }
              }
            }
          }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Criar usuário",
        operationId: "createUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserCreate" },
              example: { name: "Brayan", email: "brayan@example.com" }
            }
          }
        },
        responses: {
          201: {
            description: "Usuário criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          },
          400: { description: "Payload inválido" }
        }
      }
    },

    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Obter usuário por ID",
        operationId: "getUserById",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
        responses: {
          200: {
            description: "Usuário encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          },
          404: { description: "Não encontrado" }
        }
      }
    },

    "/users/{id}/notify": {
      post: {
        tags: ["Users"],
        summary: "Notificar usuário",
        operationId: "notifyUser",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserNotify" },
              example: { message: "Seu pagamento foi aprovado." }
            }
          }
        },
        responses: {
          200: {
            description: "Notificação enviada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    userId: { type: "integer", example: 1 },
                    message: { type: "string", example: "Seu pagamento foi aprovado." }
                  }
                }
              }
            }
          },
          404: { description: "Usuário não encontrado" }
        }
      }
    }
  },

  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Brayan" },
          email: { type: "string", format: "email", example: "brayan@example.com" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      UserCreate: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" }
        }
      },
      UserNotify: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string", example: "Seu pagamento foi aprovado." }
        }
      }
    }
  }
};
