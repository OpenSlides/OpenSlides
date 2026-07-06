#!/bin/bash

set -e

DATA_FILE=$1

ZITADEL_DOMAIN="http://localhost:8080"
API_TOKEN="Ysr5BietBoY0tMD5XKhWupV1vh5KsfLRO8mFzW9uKqjIllKRKi_60vZ6vWjN93L9mM7YlTY"
PAYLOAD=$(cat <<EOF
{
  "timeout" : "5m",
  "dataOrgs": $(cat "$DATA_FILE")
}
EOF
)

RESPONSE=$(curl -X POST "$ZITADEL_DOMAIN/admin/v1/import" \
  --header "Authorization: Bearer ${API_TOKEN}" \
  --header "Content-Type: application/json"\
  --data "${PAYLOAD}")

echo $RESPONSE
