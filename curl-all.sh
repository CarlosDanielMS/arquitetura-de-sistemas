#!/usr/bin/env bash

BASE="http://localhost:8000"

echo "# Users"
curl -X POST "$BASE/users/register" -H "Content-Type: application/json" -d '{"name":"Ana Silva","email":"ana.silva@example.com"}'
curl "$BASE/users/users"
curl "$BASE/users/users/1"
curl -X DELETE "$BASE/users/users/1"
curl "$BASE/users/metrics"

echo "\n# Products"
curl -X POST "$BASE/products/products" -H "Content-Type: application/json" -d '{"name":"Notebook Pro","description":"14","price":5999.90,"stock":25}'
curl "$BASE/products/products"
curl "$BASE/products/products/1"
curl -X PATCH "$BASE/products/products/1/stock" -H "Content-Type: application/json" -d '{"quantity":2}'
curl -X DELETE "$BASE/products/products/1"
curl "$BASE/products/metrics"

echo "\n# Orders"
curl -X POST "$BASE/orders/orders" -H "Content-Type: application/json" -d '{"userId":1,"productId":1,"quantity":2}'
curl "$BASE/orders/orders"
curl "$BASE/orders/orders/<orderIdMongo>"
curl "$BASE/orders/metrics"

echo "\n# Payments"
curl "$BASE/payments/payments"
curl "$BASE/payments/payments/1"
curl "$BASE/payments/payments/types"
curl "$BASE/payments/metrics"

echo "\n# Kong Metrics"
curl "http://localhost:8001/metrics"

echo "\n# Observações"
echo "Substitua <orderIdMongo> por um ID válido retornado na criação do pedido."