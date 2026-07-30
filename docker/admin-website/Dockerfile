FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/api-contract/package.json ./packages/api-contract/
COPY packages/date/package.json ./packages/date/
COPY packages/domain-shared/package.json ./packages/domain-shared/
COPY server/package.json ./server/
COPY admin-website/package.json ./admin-website/
COPY client/package.json ./client/

RUN bun install --frozen-lockfile --filter admin-website

COPY packages/api-contract ./packages/api-contract
COPY packages/date ./packages/date
COPY packages/domain-shared ./packages/domain-shared
COPY admin-website ./admin-website

WORKDIR /app/admin-website
RUN bun run build


FROM nginx:1.29-alpine

COPY --from=builder /app/admin-website/dist /usr/share/nginx/html
COPY docker/admin-website/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
