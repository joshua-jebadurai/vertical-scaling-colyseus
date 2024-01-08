FROM node:18

COPY ./src /app/src
COPY ./tsconfig.json /app
COPY ./package.json /app
COPY ./package-lock.json /app
COPY ./ecosystem.config.js /app
WORKDIR /app
RUN npm i -g pm2
RUN npm install --loglevel verbose
RUN npm run build
EXPOSE 3000-3008
CMD ["pm2-runtime", "ecosystem.config.js", "--only", "game-server"]