FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM alpine:latest
COPY --from=build /app/dist /app/dist
VOLUME /app/dist
