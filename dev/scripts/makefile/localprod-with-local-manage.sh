#!/bin/bash

set -eo pipefail

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

OS_MANAGE_PATH="$(dirname "$0")/../../../openslides-manage-service"
OS_LOCALPROD_PATH="$(dirname "$0")/../../localprod"

# Switching to manage and building openslides exe
info  "Building openslides executable"
make -C "$OS_MANAGE_PATH" openslides

# Moving openslides to localprod directory
info  "Moving openslides executable"
mv "$OS_MANAGE_PATH"/openslides "$OS_LOCALPROD_PATH"/openslides

# Setup and generate localprod docker compose
info  "Executing openslides setup"
"$OS_LOCALPROD_PATH"/openslides setup "$OS_LOCALPROD_PATH"
"$OS_LOCALPROD_PATH"/openslides config --config "$OS_LOCALPROD_PATH/config.yml" "$OS_LOCALPROD_PATH"

info "Done"
