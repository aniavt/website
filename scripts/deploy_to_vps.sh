#!/bin/bash

# Load environment variables
set -e
source .env

# Build Docker image
docker compose -f ../docker/docker-compose.yml build --parallel nginx web server web_admin s3

# Save Docker image
docker tag ania_nginx:latest ania_nginx
docker save -o ../docker/ania_nginx.tar ania_nginx

docker tag ania_web:latest ania_web
docker save -o ../docker/ania_web.tar ania_web

docker tag ania_server:latest ania_server
docker save -o ../docker/ania_server.tar ania_server

docker tag ania_web_admin:latest ania_web_admin
docker save -o ../docker/ania_web_admin.tar ania_web_admin

docker tag ania_s3_garage:latest ania_s3_garage
docker save -o ../docker/ania_s3_garage.tar ania_s3_garage

tar czvf - \
    ../docker/.env \
    ../docker/docker-compose.yml \
    ../docker/ania_nginx.tar \
    ../docker/ania_web.tar \
    ../docker/ania_server.tar \
    ../docker/ania_web_admin.tar \
    ../docker/ania_s3_garage.tar \
    ../scripts/backup.sh \
| ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "
set -e

mkdir -p '$REMOTE_PATH/docker' '$REMOTE_PATH/scripts'
tar xzf - -C '$REMOTE_PATH'

chmod +x '$REMOTE_PATH/scripts/backup.sh'
cd '$REMOTE_PATH/docker'
docker compose down -v --remove-orphans
docker load -i ania_nginx.tar 
docker load -i ania_web.tar
docker load -i ania_server.tar
docker load -i ania_web_admin.tar
docker load -i ania_s3_garage.tar
docker compose up -d
"

# Remove docker images
rm -f ../docker/ania_nginx.tar      \
      ../docker/ania_web.tar        \
      ../docker/ania_server.tar     \
      ../docker/ania_web_admin.tar  \
      ../docker/ania_s3_garage.tar