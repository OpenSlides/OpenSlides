#!/bin/bash
../server/build.sh -t openslides/openslides-server:latest
../client/build.sh -t openslides/openslides-client:latest

[[ -f docker-compose.yml ]] || m4 < docker-compose.yml.m4 > docker-compose.yml

docker-compose build
