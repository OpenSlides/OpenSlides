#!/bin/bash

set -e
cd "$(dirname $0)"

DC=../dc-dev.sh
FILE="$1"

[ -n "$FILE" ] || {
  echo "ERROR: please specify a file to run in postgres (e.g. \`dev-commands/import-sql.sh dump.sql\`)"
  exit 1
}
[ -r "$FILE" ] || {
  echo "ERROR: cannot read file $FILE"
  exit 1
}

$DC rm -svf postgres
$DC up -d postgres
# wait for postgres to be ready
until $DC exec -T postgres psql -U openslides openslides -c '\q'; do sleep 1; done
$DC exec -T postgres psql -U openslides openslides < "$FILE"

