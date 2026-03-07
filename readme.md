# Ania — inicio rápido

## Arrancar en desarrollo

1. Crear `.env`
```bash
cp docker/.env.example docker/.env
```
2. Levantar
```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
```
3. Crear usuario root (solo la primera vez)
```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml exec server \
  sh -lc "cd /app && bun run cli -- user bootstrap-root root_cli StrongRootP4ss!1"
```

## API

- **Base URL:** `http://localhost/api` (o `http://localhost:PORT/api` si cambias `PORT` en `docker/.env`).
- Ejemplo: `curl http://localhost/api/faq`

## Tras cambiar `.env`

Reconstruir y levantar de nuevo:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build
```
