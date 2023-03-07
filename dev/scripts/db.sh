#!/bin/bash
cd "$(dirname $0)"
docker-compose -f $HOME/../docker/docker-compose.dev.yml exec datastore-writer psql -h postgres -U openslides
