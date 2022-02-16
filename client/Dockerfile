FROM node:alpine

WORKDIR /app

COPY ./package*.json ./

RUN yarn set version berry

RUN yarn set version 3.0.2

RUN yarn install

COPY ./ ./

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
