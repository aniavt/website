
#--- Producción Builder + Runner ----
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
COPY client/package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY client/ .
RUN bunx --bun astro build

FROM oven/bun:1.3-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV PORT=80
ENV HOST=0.0.0.0
EXPOSE 80
CMD ["bun", "dist/server/entry.mjs"]

#--- Dev ----
FROM oven/bun:1.3-alpine AS dev
WORKDIR /app
COPY client/package.json bun.lockb* ./
RUN bun install --frozen-lockfile
ENV PORT=80
EXPOSE 80
CMD ["bunx", "--bun", "astro", "dev", "--host", "0.0.0.0", "--port", "80"]
