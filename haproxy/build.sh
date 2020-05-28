#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"
./prepare-cert.sh
docker build --tag "${img:-openslides/openslides-${service_name}:latest}" \
  --pull "${OPTIONS[@]}" .
