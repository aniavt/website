#!/bin/bash

# Load environment variables
set -e
source .env

# Build Docker image
docker compose -f ../docker/docker-compose.yml build nginx web

# Save Docker image
docker tag ania_nginx:latest ania_nginx
docker save -o ../docker/ania_nginx.tar ania_nginx

docker tag ania_web:latest ania_web
docker save -o ../docker/ania_web.tar ania_web

# Copy docker folder to VPS
scp -P $VPS_PORT -r ../docker $VPS_USER@$VPS_HOST:$REMOTE_PATH

# Remove docker images
rm -f ../docker/ania_nginx.tar ../docker/ania_web.tar

# Load images and restart containers

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" <<EOF
cd "$REMOTE_PATH/docker"
docker compose down -v --remove-orphans
docker load -i ania_nginx.tar && docker load -i ania_web.tar
docker compose up -d nginx web
EOF