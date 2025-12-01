#!/bin/bash

# Orders
cat > orders/package.json << 'EOF'
{
  "name": "orders",
  "version": "1.0.0",
  "description": "Orders microservice",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "ioredis": "^5.8.2",
    "kafkajs": "^2.2.4",
    "mongoose": "^8.0.0"
  }
}
EOF

# Payments
cat > payments/package.json << 'EOF'
{
  "name": "payments",
  "version": "1.0.0",
  "description": "Payments microservice",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "prisma": "npx prisma"
  },
  "dependencies": {
    "@prisma/client": "^6.16.3",
    "amqplib": "^0.10.3",
    "axios": "^1.6.0",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "ioredis": "^5.8.2",
    "kafkajs": "^2.2.4",
    "prisma": "^6.16.3"
  }
}
EOF

# Notification
cat > notification/package.json << 'EOF'
{
  "name": "notification",
  "version": "1.0.0",
  "description": "Notification microservice",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "prisma": "npx prisma"
  },
  "dependencies": {
    "@prisma/client": "^6.16.3",
    "amqplib": "^0.10.3",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "kafkajs": "^2.2.4",
    "nodemailer": "^6.9.7",
    "prisma": "^6.16.3"
  }
}
EOF

echo "✅ Todos os package.json foram corrigidos!"

#comdando para rodar o script
##bash fix-packages.sh
