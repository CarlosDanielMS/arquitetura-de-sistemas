# 🛒 G1 E-commerce API

API simples de e-commerce construída em **Node.js + Express**, com **Swagger (OpenAPI)** e armazenamento **em memória**. Desenvolvida para fins acadêmicos (G1 de Arquitetura).

---

## 🚀 Tecnologias utilizadas

* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [Swagger UI](https://swagger.io/tools/swagger-ui/)
* [swagger-jsdoc](https://www.npmjs.com/package/swagger-jsdoc)

---

## 📂 Estrutura do projeto

```
g1_arquitetura/
├─ index.js                # Bootstrap da aplicação
├─ swagger.js              # Configuração do Swagger
├─ src/
│  ├─ data/
│  │  └─ store.js          # "Banco de dados" em memória + helpers
│  ├─ controllers/
│  │  ├─ productsController.js  # Lógica de Produtos
│  │  └─ ordersController.js    # Lógica de Pedidos
│  └─ routes/
│     ├─ productsRoutes.js      # Rotas de Produtos
│     └─ ordersRoutes.js        # Rotas de Pedidos
```

---

## ⚙️ Instalação e execução

```bash
# 1. Clonar o repositório
git clone <url-do-seu-repo>
cd g1_arquitetura

# 2. Instalar dependências
npm install

# 3. Rodar o servidor
node index.js

# 4. Acessar a API
http://localhost:3000
```

---

## 📖 Documentação Swagger

* **Interface interativa:** [http://localhost:3000/docs](http://localhost:3000/docs)
* **Spec JSON:** [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

---

## 📌 Endpoints principais

### 🔹 Produtos

* `GET /produtos` → Lista todos os produtos.
* `GET /produtos/:id` → Busca um produto por ID.
* `POST /produtos` → Cria um novo produto.
* `PUT /produtos/:id` → Atualiza um produto existente (parcial).

### 🔹 Pedidos

* `GET /pedidos` → Lista todos os pedidos.
* `POST /pedidos` → Cria um novo pedido (verifica estoque e decrementa).

---

## 🧪 Exemplos de uso com cURL

### Criar produto

```bash
curl -X POST http://localhost:3000/produtos \
  -H "Content-Type: application/json" \
  -d '{"name":"Headset","price":199.9,"stock":5}'
```

### Criar pedido

```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":2},{"productId":2,"quantity":1}]}'
```

---

## 👨‍💻 Equipe

* Desenvolvido em dupla para o **G1 de Arquitetura**.
* Brayan Martins & Carlos Daniel Martins

---
