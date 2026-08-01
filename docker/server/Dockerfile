FROM oven/bun:1.3-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache nodejs npm \
  && npm install -g pnpm@11.4.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/api-contract/package.json ./packages/api-contract/
COPY packages/date/package.json ./packages/date/
COPY packages/domain-shared/package.json ./packages/domain-shared/
COPY server/package.json ./server/
COPY admin-website/package.json ./admin-website/
COPY client/package.json ./client/

RUN pnpm install --frozen-lockfile --prod --filter server...

COPY packages/api-contract ./packages/api-contract
COPY packages/date ./packages/date
COPY packages/domain-shared ./packages/domain-shared
COPY server ./server

WORKDIR /app/server

EXPOSE 3000

CMD ["bun", "--preload", "./src/bun-polyfills.ts", "src/index.ts"]
