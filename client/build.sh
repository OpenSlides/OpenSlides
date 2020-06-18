#!/bin/bash

cd "$(dirname "$0")"

printf "Client built on %s:\n\nBranch:     %s\n\n%s\n" \
  "$(date)" \
  "$(git rev-parse --abbrev-ref HEAD)" \
  "$(git show -s --format=raw)" > client-version.txt
docker build -f docker/Dockerfile . $@
