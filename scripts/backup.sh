#!/bin/bash

set -e

# Por entrada recibir donde esta el proyecto
PROJECT_DIR=$(realpath "$1")

if [ -z "$PROJECT_DIR" ]; then
  echo "Error: No se ha proporcionado el directorio del proyecto"
  exit 1
fi

source $PROJECT_DIR/docker/.env

# Crear directorio del backup si no existe
BACKUP_DIR="$PROJECT_DIR/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup de la base de datos
echo "🔹 Backup Mongo..."
docker exec ania_db_mongo mongodump \
  --username=${MONGO_INITDB_ROOT_USERNAME} \
  --password=${MONGO_INITDB_ROOT_PASSWORD} \
  --authenticationDatabase=admin \
  --archive > "$BACKUP_DIR/mongo_backup.archive"


# Backup del S3
echo "🔹 Backup S3..."
docker compose -f $PROJECT_DIR/docker/docker-compose.yml stop s3
tar -czvf $BACKUP_DIR/s3_backup.tar.gz -C $PROJECT_DIR/data s3-garage
docker compose -f $PROJECT_DIR/docker/docker-compose.yml up -d s3
