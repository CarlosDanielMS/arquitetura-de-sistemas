# Dockerfile – base Debian (estável para Prisma)
FROM node:20
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "index.js"]
