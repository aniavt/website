#--- Producción Builder + Runner ----
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

RUN apk add --no-cache nodejs npm \
  && npm install -g pnpm@11.4.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/api-contract/package.json ./packages/api-contract/
COPY packages/date/package.json ./packages/date/
COPY packages/domain-shared/package.json ./packages/domain-shared/
COPY server/package.json ./server/
COPY admin-website/package.json ./admin-website/
COPY client/package.json ./client/

RUN pnpm install --frozen-lockfile --filter client...

COPY packages/api-contract ./packages/api-contract
COPY packages/domain-shared ./packages/domain-shared
COPY client ./client

WORKDIR /app/client
RUN bunx --bun astro build

FROM oven/bun:1.3-alpine AS runner
WORKDIR /app
COPY --from=builder /app/client/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/node_modules ./client/node_modules
COPY --from=builder /app/packages ./packages
ENV PORT=80
ENV HOST=0.0.0.0
EXPOSE 80
CMD ["bun", "dist/server/entry.mjs"]

#--- Dev ----
FROM oven/bun:1.3-alpine AS dev
WORKDIR /workspace
ENV PORT=80
EXPOSE 80
CMD ["sh", "-lc", "apk add --no-cache nodejs npm && npm install -g pnpm@11.4.0 && pnpm install && cd client && bunx --bun astro dev --host 0.0.0.0 --port 80"]
