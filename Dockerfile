# ================-- DEPENDENCIES installation layer --================ #
FROM node:16.13.1 AS vendor
WORKDIR /build
COPY package*.json ./
RUN npm install
# ==========================-- BUILD layer --========================== #
FROM vendor AS build-prod
WORKDIR /build
COPY . .
RUN npm run build
# =======================-- FINAL IMAGE layer --======================= #
FROM nginx:1.22.1-alpine as app-base
COPY .image/invoices.conf /etc/nginx/conf.d/default.conf

FROM app-base as app-prod
COPY --from=build-prod /build/dist /var/www/html/invoices
