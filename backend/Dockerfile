FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Gerekli dizinleri oluştur
RUN mkdir -p uploads logs

EXPOSE 3000

CMD ["node", "server.js"]