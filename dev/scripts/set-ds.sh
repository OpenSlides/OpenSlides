#!/bin/bash

set -e
cd "$(dirname $0)"

DATA=${1:-../../openslides-backend/global/data/example-data.json}
docker compose -f ../docker/docker-compose.dev.yml exec -T datastore-writer python cli/import_data_only.py < "$DATA"
