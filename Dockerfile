FROM node:latest AS build
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install 
COPY . .
RUN npm run build

FROM node:latest
ENV NODE_ENV=production
ENV SPOTIFY_SHUFFLE_PORT=8099
WORKDIR /app
COPY --from=build /app/dist .
COPY --from=build /app/node_modules ./node_modules
RUN pwd
CMD [ "node", "index.js" ]
