FROM oven/bun:1.3-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copiamos el package.json del server y resolvemos dependencias
COPY server/package.json bun.lockb* ./
RUN bun install --production --frozen-lockfile

# Copiamos el código fuente del servidor
COPY server/ .

EXPOSE 3000

# Arrancamos el servidor Fastify con Bun en modo producción
CMD ["bun", "run", "src/index.ts"]
