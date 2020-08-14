#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"
service_name="$(basename "$PWD")"
version_file="docker/${service_name}-version.txt"

{
  printf "${service_name^} built on %s:\n\n" "$(date)"
  printf "Branch:     %s\n" "$(git rev-parse --abbrev-ref HEAD)"
  printf '\n'
  git show -s --format=raw
} > "$version_file"

docker build --tag "${img:-openslides/openslides-${service_name}:latest}" \
  --pull "${OPTIONS[@]}" -f docker/Dockerfile .

rm "$version_file" || true
unset version_file
unset service_name
