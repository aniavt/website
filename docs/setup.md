# Setup local (Docker)

Guía de arranque del stack Ania en local. Para Garage/S3 (layout, keys, bucket y `AWS_*`), ver [docs/s3.md](./s3.md).

## Requisitos

- Docker + Docker Compose
- Puerto libre definido en `PORT` (por defecto `80`)
- `pnpm` en el host solo si instalas deps fuera de Docker (`packageManager` en el root). El **runtime** de server/web sigue siendo **Bun**.

## 1. Variables de entorno

```bash
cp docker/.env.example docker/.env
```

Sustituir los placeholders `CHANGE_ME_*` (Mongo, `COOKIE_SECRET`, `JWT_SECRET`).

Notas:

- Compose inyecta `MONGO_URI` al server con `replicaSet=rs0` (necesario para transacciones).
- En local conviene `S3_PUBLIC_ENDPOINT=http://localhost` para que las URLs de media funcionen en el navegador (si no, se usa `S3_ENDPOINT`, IP interna).
- Las credenciales `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` se rellenan **después** de crear la key en Garage ([docs/s3.md](./s3.md)).

## 2. Keyfile de Mongo (obligatorio, una vez)

Mongo corre como replica set `rs0` con autenticación. En ese modo hace falta un **keyFile**. El archivo **no se genera solo**: hay que crearlo en el host y montarlo.

```bash
openssl rand -base64 756 > docker/mongo-keyfile
chmod 400 docker/mongo-keyfile
```

- Ruta: `docker/mongo-keyfile` (está en `.gitignore`; no se versiona).
- Compose lo monta como `/etc/mongo-keyfile-src` (solo lectura).

### Qué hace `docker/mongo-entrypoint.sh`

Al arrancar el servicio `db`:

1. Copia el keyfile montado a `/tmp/mongo-keyfile`.
2. Ajusta dueño `mongodb:mongodb` y permisos `400` (requisito de `mongod`).
3. Delega al entrypoint oficial de la imagen:

```text
mongod --replSet rs0 --bind_ip_all --keyFile /tmp/mongo-keyfile
```

Sin `docker/mongo-keyfile`, el contenedor `ania_db_mongo` no arranca correctamente.

El healthcheck de Compose inicia el replica set (`rs.initiate`) si aún no existe y espera a que haya PRIMARY.

## 3. Garage (S3)

Levantar e inicializar Garage (layout, key, bucket, permisos) y volcar `AWS_*` en `docker/.env` según [docs/s3.md](./s3.md).

Orden recomendado la primera vez: solo `s3` → init Garage → completar `.env` → resto del stack (así no hace falta rebuild masivo solo por las keys).

```bash
docker compose -f docker/docker-compose.yml up -d s3
# … pasos de docs/s3.md …
```

## 4. Levantar el stack

### Desarrollo (hot-reload)

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build
```

### Producción local (imágenes build)

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Servicios: `nginx` (host), `db`, `server`, `web`, `web_admin`, `s3`.

Tras cambiar `.env` de forma que afecte al server (p. ej. `AWS_*`), reiniciar o recrear el server:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml restart server
```

## 5. Usuario root

CLI dentro del contenedor `server` (preload Bun necesario por compatibilidad bson/Mongo):

**Prod (WORKDIR `/app/server`):**

```bash
docker compose -f docker/docker-compose.yml exec server \
  sh -lc 'cd /app/server && bun --preload ./src/bun-polyfills.ts src/index.ts --cli user create-root root_cli StrongRootP4ss!1'
```

**Dev (overlay `.dev`, workdir `/workspace`):**

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml exec server \
  sh -lc 'cd /workspace/server && bun --preload ./src/bun-polyfills.ts src/index.ts --cli user create-root root_cli StrongRootP4ss!1'
```

Sustituir usuario/password por valores propios. El CLI puede quedar colgado tras imprimir el usuario (conexión Mongo no cierra); con Ctrl+C basta si ya se vio el dump del user.

## 6. URLs

| URL | Servicio |
|-----|----------|
| `http://localhost/` | Client (web) |
| `http://localhost/admin/` | Admin |
| `http://localhost/api/` | API (health: `{ "message": "Ania API is running" }`) |

Si `PORT` ≠ `80`, usar `http://localhost:<PORT>/…`.

## Checklist primera vez

1. `cp docker/.env.example docker/.env` y rellenar secrets.
2. Generar `docker/mongo-keyfile` (sección 2).
3. Init Garage + `AWS_*` → [docs/s3.md](./s3.md).
4. `docker compose … up -d --build`.
5. Crear usuario root (sección 5).
6. Smoke: `/api/`, `/admin/`, `/`.
