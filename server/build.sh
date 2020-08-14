#!/bin/bash

cd "$(dirname "$0")"

printf "Server built on %s:\n\nBranch:     %s\n\n%s\n" \
  "$(date)" \
  "$(git rev-parse --abbrev-ref HEAD)" \
  "$(git show -s --format=raw)" > docker/server-version.txt

docker build -f docker/Dockerfile . $@
