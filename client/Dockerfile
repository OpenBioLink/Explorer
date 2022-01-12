# syntax=docker/dockerfile:1

FROM node:14.16.0

WORKDIR /usr/src/app
COPY ./client ./client
COPY ./api ./api

WORKDIR /usr/src/app/client
ENV NODE_ENV=production
RUN npm install --production
RUN npm run build
RUN npm install -g local-web-server

EXPOSE 5000

CMD ws --port 5000 --directory build --spa index.html --rewrite '/rpc -> http://server:3001/rpc'
