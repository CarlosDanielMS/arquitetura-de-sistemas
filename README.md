# G1 Arquitetura — E-commerce API

API em **Node.js + Express**, com **PostgreSQL** e **Prisma ORM**, rodando via **Docker Compose**.

---

## 🚀 Tecnologias

* Node.js 20 (Debian)
* Express.js
* Prisma ORM 5.22.0
* PostgreSQL 16
* Swagger (documentação automática)
* Docker / Docker Compose

---

## 📂 Estrutura do Projeto

```
├── index.js              # App Express
├── swagger.js            # Configuração Swagger
├── prisma/
│   ├── schema.prisma     # Modelo do banco (Prisma)
│   ├── migrations/       # Histórico de migrations
│   └── seed.js           # Script de seed inicial
├── src/
│   ├── controllers/      # Controllers (Products, Orders)
│   ├── routes/           # Rotas Express
│   └── data/             # (versão inicial em memória)
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🐳 Subindo o Projeto

### 1. Build + start

```bash
docker compose up --build -d
```

### 2. Criar tabelas e seed inicial

```bash
docker compose run --rm api sh -lc "npx prisma migrate dev --name init && npm run prisma:seed"
```

### 3. Ver status

```bash
docker compose ps
```

### 4. Acessar a API

* Produtos: [http://localhost:3000/produtos](http://localhost:3000/produtos)
* Pedidos: [http://localhost:3000/pedidos](http://localhost:3000/pedidos)
* Swagger Docs: [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 📦 Endpoints

### Produtos

* **GET** `/produtos` → lista produtos
* **GET** `/produtos/:id` → busca por ID
* **POST** `/produtos` → cria produto

  ```json
  {
    "name": "Monitor Gamer",
    "price": 1299.90,
    "stock": 15
  }
  ```
* **PUT** `/produtos/:id` → atualiza produto
* **DELETE** `/produtos/:id` → deleta produto

### Pedidos

* **GET** `/pedidos` → lista pedidos
* **GET** `/pedidos/:id` → busca pedido
* **POST** `/pedidos` → cria pedido (checa/decrementa estoque)

  ```json
  {
    "items": [
      { "productId": 1, "quantity": 2 },
      { "productId": 2, "quantity": 1 }
    ]
  }
  ```

---

## 🗄️ Banco de Dados

* **Host:** `localhost`
* **Port:** `5432`
* **DB:** `g1db`
* **User:** `g1`
* **Password:** `g1pass`

### Comandos úteis

```bash
# acessar via psql
docker compose exec db psql -U g1 -d g1db

# listar tabelas
\dt

# resetar banco (migrations + seed)
docker compose run --rm api sh -lc "npx prisma migrate reset --force && npm run prisma:seed"
```

---

## 🧪 Testes rápidos (curl)

```bash
# criar produto
curl -X POST http://localhost:3000/produtos \
 -H "Content-Type: application/json" \
 -d '{"name":"Headset","price":199.90,"stock":5}'

# criar pedido
curl -X POST http://localhost:3000/pedidos \
 -H "Content-Type: application/json" \
 -d '{"items":[{"productId":1,"quantity":1}]}'
```
