#!/bin/bash
docker-compose -f docker/docker-compose.dev.yml exec datastore-writer psql -h postgres -U openslides
