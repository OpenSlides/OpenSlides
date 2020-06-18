#!/bin/bash
../server/build.sh -t openslides/openslides-server:latest
../client/build.sh -t openslides/openslides-client:latest
docker-compose build
