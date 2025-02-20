FROM node:22-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY ecosystem.config.js .
COPY .env.staging /app/.env.production
COPY ./src ./src
COPY .env /app/.env

RUN apk add --no-cache python3
RUN npm install pm2 -g
RUN npm install
RUN npm run build

EXPOSE 4000

CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]