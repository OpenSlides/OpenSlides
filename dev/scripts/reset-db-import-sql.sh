#!/bin/bash

set -e

DC="$(dirname $0)/dc-dev.sh"
FILE="$1"

[ -n "$FILE" -a -r "$FILE" ] || {
  echo "ERROR: cannot read file $FILE"
  exit 1
}

$DC rm -svf postgres
$DC up -d postgres
# call cli script in the DS and pass local file via STDIN
$DC exec -T datastore-writer 'cli/import_events.sh -' < "$FILE"
# recreate autoupdate and depending services for output consistency
$DC up -d --force-recreate autoupdate
