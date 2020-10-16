#!/bin/bash
cd "$(dirname $0)"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml $@