#!/bin/bash

set -e
cd "$(dirname $0)"

# first argument is the example data
DATA=$(cat ${1:-../../openslides-backend/global/data/example-data.json})
./clear-ds.sh
docker-compose -f ../docker/docker-compose.dev.yml exec datastore-writer \
    bash -c "source export-database-variables.sh; echo '$DATA' > /data.json; export DATASTORE_INITIAL_DATA_FILE=/data.json; python cli/create_initial_data.py"
