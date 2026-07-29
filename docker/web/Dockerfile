
#--- Producción Builder + Runner ----
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/api-contract/package.json ./packages/api-contract/
COPY client/package.json ./client/

RUN bun install --frozen-lockfile

COPY packages/api-contract ./packages/api-contract
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
CMD ["sh", "-lc", "bun install && cd client && bunx --bun astro dev --host 0.0.0.0 --port 80"]

