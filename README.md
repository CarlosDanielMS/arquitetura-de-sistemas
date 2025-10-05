# 🧩 Microservices - CRUD

Coleção Postman completa para testar todos os microsserviços do projeto **Microservices** — incluindo **Users**, **Products**, **Orders**, **Payments** e **Notification**.

Este guia explica passo a passo como importar, configurar e testar todas as rotas automaticamente.

---

## 🚀 Estrutura Geral

A collection foi construída para cobrir todo o ciclo CRUD e as integrações entre os microsserviços:

* **Users** → autenticação, login e perfil.
* **Products** → catálogo de produtos com controle de estoque.
* **Orders** → criação, confirmação e cancelamento de pedidos.
* **Payments** → processamento de pagamentos simulados (aprovados/reprovados).
* **Notification** → envio de e-mails simulados e logs de notificação.

---

## 🧱 Arquivos Importantes

| Arquivo                           | Descrição                                            |
| --------------------------------- | ---------------------------------------------------- |
| `testes.postman_collection.json`  | Contém todas as rotas organizadas por microsserviço. |
| `testes.postman_environment.json` | Define variáveis de ambiente (URLs, IDs e tokens).   |

> ✅ Ambos os arquivos devem ser importados no Postman **antes de começar os testes**.

---

## ⚙️ Passo a Passo de Instalação

### **1️⃣ Limpe o Postman**

Antes de importar:

* Vá em **Collections** → delete todas as coleções antigas.
* Vá em **Environments** → delete todos os ambientes antigos.

### **2️⃣ Importe os Arquivos**

* Clique em **Import → Files**.
* Selecione **os dois arquivos**: `testes.postman_collection.json` e `testes.postman_environment.json`.

### **3️⃣ Ative o Ambiente**

* No canto superior direito do Postman, selecione o ambiente:
  🔹 **Testes Environment**

### **4️⃣ Confirme as Variáveis**

Clique no ícone de olho 👁️ (ao lado do ambiente) e confira:

| Variável              | Valor                                          |
| --------------------- | ---------------------------------------------- |
| base_url_users        | [http://localhost:3002](http://localhost:3002) |
| base_url_products     | [http://localhost:3001](http://localhost:3001) |
| base_url_orders       | [http://localhost:3004](http://localhost:3004) |
| base_url_payments     | [http://localhost:3003](http://localhost:3003) |
| base_url_notification | [http://localhost:3005](http://localhost:3005) |

Se tudo estiver correto, os endpoints vão preencher automaticamente no campo de URL.

---

## 🌐 Endpoints Principais

### **USERS**

| Método | Endpoint    | Descrição                             |
| ------ | ----------- | ------------------------------------- |
| POST   | `/register` | Registra novo usuário.                |
| POST   | `/login`    | Faz login e retorna JWT.              |
| GET    | `/me`       | Retorna dados do usuário autenticado. |

> 💡 O token JWT é usado automaticamente nos requests que o exigem.

---

### **PRODUCTS**

| Método | Endpoint              | Descrição                              |
| ------ | --------------------- | -------------------------------------- |
| POST   | `/products`           | Cria um novo produto.                  |
| GET    | `/products`           | Lista todos os produtos.               |
| GET    | `/products/:id`       | Busca um produto específico.           |
| PUT    | `/products/:id`       | Atualiza informações do produto.       |
| PATCH  | `/products/:id/stock` | Atualiza o estoque (aumenta ou reduz). |
| DELETE | `/products/:id`       | Remove o produto.                      |

---

### **ORDERS**

| Método | Endpoint              | Descrição                   |
| ------ | --------------------- | --------------------------- |
| POST   | `/orders`             | Cria um pedido.             |
| GET    | `/orders`             | Lista todos os pedidos.     |
| GET    | `/orders/:id`         | Busca um pedido específico. |
| PATCH  | `/orders/:id/confirm` | Confirma o pedido.          |
| PATCH  | `/orders/:id/cancel`  | Cancela o pedido.           |

> ⚙️ O serviço **Orders** comunica-se automaticamente com **Products** e **Notification**.

---

### **PAYMENTS**

| Método | Endpoint                | Descrição                                                 |
| ------ | ----------------------- | --------------------------------------------------------- |
| POST   | `/payments`             | Cria um pagamento.                                        |
| POST   | `/payments/:id/process` | Processa o pagamento (randomicamente aprovado/reprovado). |
| GET    | `/payments`             | Lista todos os pagamentos.                                |
| GET    | `/payments/:id`         | Retorna um pagamento específico.                          |

> 🎲 O processamento é randômico — simula comportamento real de gateways de pagamento.

---

### **NOTIFICATION**

| Método | Endpoint         | Descrição                                     |
| ------ | ---------------- | --------------------------------------------- |
| POST   | `/notify`        | Envia uma notificação simulada (e-mail fake). |
| GET    | `/notifications` | Lista todas as notificações enviadas.         |

---

## 🧠 Dicas de Uso

* Para atualizar o token JWT automaticamente após o login, adicione este script na aba **Tests** da request `/login`:

```js
const jsonData = pm.response.json();
if (jsonData.token) {
  pm.environment.set("jwt_token", jsonData.token);
  console.log("✅ Token salvo automaticamente!");
}
```

* O campo de URL deve preencher automaticamente assim que o ambiente estiver ativo.

Exemplo:

```
{{base_url_users}}/register  →  http://localhost:3002/register
```

---

## 🧩 Estrutura do Projeto

```
project-root/
 ├─ products/      → CRUD e estoque
 ├─ orders/        → Pedidos (MongoDB)
 ├─ payments/      → Pagamentos (PostgreSQL)
 ├─ users/         → Autenticação e JWT
 ├─ notification/  → Envio de e-mails simulados
 └─ docker-compose.yml → Sobe tudo de uma vez
```

---

## 🧪 Teste Final

1. Suba os serviços com Docker:

   ```bash
   docker compose up -d --build
   ```
2. Abra o Postman.
3. Escolha o ambiente **Testes Environment**.
4. Teste as rotas na ordem:

   1. Register User
   2. Login User
   3. Create Product
   4. Create Order
   5. Process Payment
   6. Check Notifications

> ✅ Se tudo estiver certo, você verá o ciclo completo do fluxo rodando entre os microsserviços.

---

## 🧾 Créditos

Desenvolvido por **Brayan Martins & Carlos Daniel Martins**
Versão de Collection: `v2.1.0`
