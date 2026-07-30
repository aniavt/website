FROM oven/bun:1.3-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY packages/api-contract/package.json ./packages/api-contract/
COPY packages/date/package.json ./packages/date/
COPY packages/domain-shared/package.json ./packages/domain-shared/
COPY server/package.json ./server/
COPY admin-website/package.json ./admin-website/
COPY client/package.json ./client/

RUN bun install --production --frozen-lockfile --filter server

COPY packages/api-contract ./packages/api-contract
COPY packages/date ./packages/date
COPY packages/domain-shared ./packages/domain-shared
COPY server ./server

WORKDIR /app/server

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
