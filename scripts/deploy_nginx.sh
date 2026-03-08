#!/bin/bash

# Load environment variables
set -e
source .env


# Build Docker image
docker compose -f ../docker/docker-compose.yml build nginx


# Save Docker image
docker tag ania_nginx:latest ania_nginx
docker save -o ../docker/ania_nginx.tar ania_nginx


# Copy docker folder to VPS
scp -P $VPS_PORT -r ../docker $VPS_USER@$VPS_HOST:$REMOTE_PATH

# Remove docker image
rm -f ../docker/ania_nginx.tar

# Remove nginx container and load image
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" <<EOF
cd "$REMOTE_PATH/docker"
docker compose stop nginx
docker rm -v nginx || true
docker load -i ania_nginx.tar
docker compose up -d nginx
EOF