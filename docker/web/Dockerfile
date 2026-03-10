# --- builder: build Astro static site ---
FROM node:25-alpine3.22 AS builder

WORKDIR /app

COPY client/package.json client/package-lock.json* ./
RUN npm ci

COPY client/ .
RUN npm run build

# --- production: serve static files with nginx ---
FROM nginx:alpine

COPY docker/web/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
