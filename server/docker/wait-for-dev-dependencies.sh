#!/bin/bash

set -e

wait-for-it -t 0 redis:6379

until pg_isready -h postgres -p 5432 -U openslides; do
    echo "Waiting for Postgres to become available..."
    sleep 3
done
