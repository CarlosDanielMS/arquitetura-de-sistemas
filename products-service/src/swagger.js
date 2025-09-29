module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Products Service API",
    version: "1.0.0",
    description: "API de Produtos: CRUD e atualização de estoque."
  },
  servers: [
    { url: "http://localhost:3001", description: "Local" },
    { url: "http://products-service:3001", description: "Docker network" }
  ],
  tags: [{ name: "Products", description: "Operações de produtos" }],
  paths: {
    "/products": {
      get: {
        tags: ["Products"],
        summary: "Listar produtos",
        operationId: "listProducts",
        responses: {
          200: {
            description: "Lista de produtos",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Product" } }
              }
            }
          }
        }
      },
      post: {
        tags: ["Products"],
        summary: "Criar produto",
        operationId: "createProduct",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductCreate" },
              example: { name: "Mouse Gamer", price: 149.9, stock: 25 }
            }
          }
        },
        responses: {
          201: {
            description: "Produto criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          },
          400: { description: "Payload inválido" }
        }
      }
    },

    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Buscar produto por ID",
        operationId: "getProductById",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
        responses: {
          200: {
            description: "Produto encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          },
          404: { description: "Não encontrado" }
        }
      },
      put: {
        tags: ["Products"],
        summary: "Atualizar produto (nome/preço; estoque separado)",
        operationId: "updateProduct",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductUpdate" },
              example: { name: "Mouse Gamer Pro", price: 169.9 }
            }
          }
        },
        responses: {
          200: {
            description: "Produto atualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          },
          404: { description: "Não encontrado" }
        }
      }
    },

    "/products/{id}/estoque": {
      patch: {
        tags: ["Products"],
        summary: "Atualizar estoque do produto",
        operationId: "updateProductStock",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StockUpdate" },
              examples: {
                setAbsolute: { value: { stock: 18 } }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Estoque atualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          },
          400: { description: "Estoque inválido" },
          404: { description: "Não encontrado" }
        }
      }
    }
  },

  components: {
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Mouse Gamer" },
          price: { type: "number", format: "float", example: 149.9 },
          stock: { type: "integer", example: 25 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      ProductCreate: {
        type: "object",
        required: ["name", "price", "stock"],
        properties: {
          name: { type: "string" },
          price: { type: "number", format: "float" },
          stock: { type: "integer", minimum: 0 }
        }
      },
      ProductUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "number", format: "float" }
        },
        additionalProperties: false
      },
      StockUpdate: {
        type: "object",
        required: ["stock"],
        properties: {
          stock: { type: "integer", minimum: 0, example: 18 }
        }
      }
    }
  }
};
