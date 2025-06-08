FROM node:lts-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
RUN chown -R node /usr/src/app
USER node
CMD ["node", "server.js"]
