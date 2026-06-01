#!/bin/bash

set -eo pipefail

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

OS_CLI_PATH="$(dirname "$0")/../../../openslides-cli"
OS_LOCALPROD_PATH="$(dirname "$0")/../../localprod"

# Switching to manage and building osmanage binary
info  "Building osmanage executable"
make -C "$OS_CLI_PATH" osmanage

# Moving osmanage to localprod directory
info  "Moving osmanage executable"
mv "$OS_CLI_PATH"/osmanage "$OS_LOCALPROD_PATH"/osmanage

# Copying compose template to localprod directory
info  "Copying compose template"
cp "$OS_CLI_PATH"/contrib/docker-compose.yml.tmpl "$OS_LOCALPROD_PATH"/docker-compose.yml.tmpl

# Setup and generate localprod docker compose
info  "Executing osmanage setup"
"$OS_LOCALPROD_PATH"/osmanage setup \
  --config "$OS_LOCALPROD_PATH/config.yml" \
  --template "$OS_LOCALPROD_PATH/docker-compose.yml.tmpl" \
  "$OS_LOCALPROD_PATH"
"$OS_LOCALPROD_PATH"/osmanage config --force \
  --config "$OS_LOCALPROD_PATH/config.yml" \
  --template "$OS_LOCALPROD_PATH/docker-compose.yml.tmpl" \
  "$OS_LOCALPROD_PATH"

info "Done"
