#!/bin/bash

cd "$(dirname "$0")"

printf "Server built on %s:\n\nBranch:     %s\n\n%s\n" \
  "$(date)" \
  "$(git rev-parse --abbrev-ref HEAD)" \
  "$(git show -s --format=raw)" > docker/server-version.txt

# @Gernot: TODO
# SECRET_KEY=$(head /dev/urandom | tr -dc 'A-Za-z0-9!"#$%&()*+,-./:;<=>?@[]^_`{|}~' | head -c 64)
# sed: \/& must be escaped...
# ESCAPED_SECRET_KEY=$(printf "%s\n" "$SECRET_KEY" | sed -e 's/[\/&]/\\&/g')
# sed -i \
#     -e "/SECRET_KEY/s/%%secret-key%%/$ESCAPED_SECRET_KEY/" \
#     docker/settings.py

docker build -f docker/Dockerfile . $@
