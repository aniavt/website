FROM oven/bun:1 AS builder

WORKDIR /app

COPY client/package.json bun.lockb* ./
RUN bun install

COPY client/ .
RUN bunx --bun astro build
# Prevent adapter from starting its own server (we serve static + handle via serve.mjs)
RUN sed -i 's/serverEntrypointModule\[_start\](_manifest, _args);/\/\/ &/' dist/server/entry.mjs

FROM oven/bun:1 AS runner

WORKDIR /app

COPY --from=builder /app ./
COPY docker/web/serve.mjs ./

ENV PORT=80
EXPOSE 80

CMD ["bun", "run", "serve.mjs"]
