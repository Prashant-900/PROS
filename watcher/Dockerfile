FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY watcher.js ./

CMD ["node", "watcher.js"]
