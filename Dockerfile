FROM node:24-alpine

RUN apk add --no-cache bash

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3002

COPY wait-for-db.sh /app/wait-for-db.sh
RUN chmod +x /app/wait-for-db.sh

CMD ["sh", "-c", "npx prisma db push && node dist/src/main.js"]