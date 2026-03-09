#!/bin/bash

set -eo pipefail

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

# Switching to manage and building openslides exe
info  "Building openslides executable"
cd "$(dirname "$0")"/../../../openslides-manage-service || exit 1
make openslides

# Moving openslides to localprod directory
info  "Moving openslides executable"
mv ./openslides ../dev/localprod/openslides
cd ../dev/localprod || exit 1

# Setup and generate localprod docker compose
info  "Executing openslides setup"
./openslides setup .
./openslides config --config config.yml .

success "Done"
