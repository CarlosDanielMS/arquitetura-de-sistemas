FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
# se seu swagger/index estiver na raiz, ajuste o COPY
# COPY . .

EXPOSE 3002
CMD [ "node", "src/index.js" ]
