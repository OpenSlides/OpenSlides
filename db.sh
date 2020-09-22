#!/bin/bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec datastore-writer psql -h postgres -U openslides
