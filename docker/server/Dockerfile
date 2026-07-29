FROM oven/bun:1.3-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY packages/api-contract/package.json ./packages/api-contract/
COPY server/package.json ./server/

RUN bun install --production --frozen-lockfile

COPY packages/api-contract ./packages/api-contract
COPY server ./server

WORKDIR /app/server

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
