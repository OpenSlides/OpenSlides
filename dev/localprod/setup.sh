#!/bin/bash

[[ -f ./osmanage ]] ||
  wget https://github.com/OpenSlides/openslides-cli/releases/download/dev/osmanage

[[ -f ./docker-compose.yml.tmpl ]] ||
  wget https://raw.githubusercontent.com/OpenSlides/openslides-cli/refs/heads/main/contrib/docker-compose.yml.tmpl

[[ -x ./osmanage ]] ||
  chmod +x ./osmanage

./osmanage setup .
./osmanage config --config config.yml --template docker-compose.yml.tmpl .
