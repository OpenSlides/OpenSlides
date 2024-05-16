#!/bin/bash

set -e
cd "$(dirname $0)"

TARGET=${1:-export.json}
docker compose -f ../docker/docker-compose.dev.yml exec -T datastore-writer python cli/export_data_only.py > "$TARGET"
