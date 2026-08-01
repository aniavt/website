# Ania — inicio rápido

Setup completo (`.env`, Mongo keyfile, Garage, root, URLs): **[docs/setup.md](./docs/setup.md)**.  
S3/Garage en detalle: **[docs/s3.md](./docs/s3.md)**.

## Arrancar en desarrollo

1. Crear `.env` y keyfile Mongo (ver [docs/setup.md](./docs/setup.md)):
```bash
cp docker/.env.example docker/.env
openssl rand -base64 756 > docker/mongo-keyfile && chmod 400 docker/mongo-keyfile
```
2. Init Garage / `AWS_*` si es la primera vez → [docs/s3.md](./docs/s3.md).
3. Levantar
```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
```
4. Crear usuario root
```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml exec server \
  sh -lc 'cd /workspace/server && bun --preload ./src/bun-polyfills.ts src/index.ts --cli user create-root root_cli StrongRootP4ss!1'
```

## API

- **Base URL:** `http://localhost/api` (o `http://localhost:PORT/api` si cambias `PORT` en `docker/.env`).
- Ejemplo: `curl http://localhost/api/faq`

## Tras cambiar `.env`

Reconstruir y levantar de nuevo:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build
```
