#!/bin/bash

set -e
cd "$(dirname $0)"

TARGET=${1:-export.json}
URL="http://localhost:9010/internal/datastore/reader/get_everything"
curl --header "Content-Type: application/json" -d '{}' $URL 2> /dev/null | python3 strip-meta-fields.py > $TARGET
