#!/bin/bash

[[ -f ./osmanage ]] ||
  wget https://github.com/OpenSlides/openslides-cli/releases/download/dev/osmanage

[[ -f ./docker-compose.yml.tmpl ]] ||
  wget https://raw.githubusercontent.com/OpenSlides/openslides-cli/refs/heads/main/contrib/docker-compose.yml.tmpl

[[ -x ./osmanage ]] ||
  chmod +x ./osmanage

./osmanage setup --config config.yml --template docker-compose.yml.tmpl .
# --force overwrites existing files (i.e. docker-compose.yml)
./osmanage config --force --config config.yml --template docker-compose.yml.tmpl .
