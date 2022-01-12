# syntax=docker/dockerfile:1

FROM node:14.16.0

WORKDIR /usr/src/app
COPY ./server ./server
COPY ./api ./api

WORKDIR /usr/src/app/server
ENV NODE_ENV=production
RUN npm install --production

EXPOSE 3001

CMD ["node", "./server.js"]
