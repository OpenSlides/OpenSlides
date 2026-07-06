#!/bin/bash

set -e

ZITADEL_DOMAIN="http://localhost:8080"
API_TOKEN="Ysr5BietBoY0tMD5XKhWupV1vh5KsfLRO8mFzW9uKqjIllKRKi_60vZ6vWjN93L9mM7YlTY"
CLIENT_ID="380008909747847171"
PAYLOAD=$(cat <<EOF
{
  "timeout": "10m",
  "with_passwords": true,
  "with_otp": true
}
EOF
)

RESPONSE=$(curl -X POST "$ZITADEL_DOMAIN/admin/v1/export" \
  --header "Authorization: Bearer ${API_TOKEN}" \
  --header "Content-Type: application/json"\
  --data "${PAYLOAD}")

echo $RESPONSE
