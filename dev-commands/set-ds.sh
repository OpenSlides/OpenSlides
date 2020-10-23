#!/bin/bash

set -e
cd "$(dirname $0)"

# first argument is the example data
DATA=$(cat ${1:-../docs/example-data.json})
./clear-ds.sh
docker-compose -f ../docker-compose.yml -f ../docker-compose.dev.yml exec datastore-writer \
    bash -c "source export-database-variables.sh; echo '$DATA' > /data.json; export DATASTORE_INITIAL_DATA_FILE=/data.json; python cli/create_initial_data.py"
