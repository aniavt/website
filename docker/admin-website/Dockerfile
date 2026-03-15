FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

COPY admin-website/package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY admin-website/ .
RUN bun run build


FROM nginx:1.29-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/admin-website/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
