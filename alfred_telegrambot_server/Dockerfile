FROM node:latest
WORKDIR /usr/src/app
EXPOSE 2300

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "node", "telegramBot.js" ]