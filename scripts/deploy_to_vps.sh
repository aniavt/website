#!/bin/bash

# Load environment variables
set -e
source .env

# Build Docker image
docker compose -f ../docker/docker-compose.yml build

# Save Docker image
docker tag ania_nginx:latest ania_nginx
docker save -o ../docker/ania_nginx.tar ania_nginx

# Copy docker folder to VPS
scp -P $VPS_PORT -r ../docker $VPS_USER@$VPS_HOST:$REMOTE_PATH

# Load images and restart containers
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd $REMOTE_PATH/docker && docker compose down -v --remove-orphans && docker load -i ania_nginx.tar && docker compose up -d"
