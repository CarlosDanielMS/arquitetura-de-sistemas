#!/bin/bash
echo "🚨 ATENÇÃO: Este script vai APAGAR TUDO do Docker!"
echo "Containers, imagens, volumes, redes e cache serão excluídos."
read -p "Tem certeza que deseja continuar? (y/n): " confirm

if [ "$confirm" != "y" ]; then
  echo "❌ Operação cancelada."
  exit 0
fi

echo "🛑 Parando todos os containers..."
docker stop $(docker ps -aq) 2>/dev/null

echo "🧹 Removendo todos os containers..."
docker rm -f $(docker ps -aq) 2>/dev/null

echo "🔥 Removendo todas as imagens..."
docker rmi -f $(docker images -q) 2>/dev/null

echo "🗑️ Removendo todos os volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null

echo "🌐 Removendo todas as redes customizadas..."
docker network rm $(docker network ls -q) 2>/dev/null

echo "🧼 Limpando cache e arquivos órfãos..."
docker system prune -a --volumes -f

echo "✅ Docker limpo com sucesso!"
docker system df
 