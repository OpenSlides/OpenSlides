#!/bin/bash

set -e

# hash the new password
response=$(docker-compose exec auth curl --header "Content-Type: application/json" -d '{"toHash": "admin"}' http://localhost:9004/internal/auth/hash)
hash=$(jq .hash <<< $response)

# Set user/1/password to $hash
request_data_prefix='{"user_id": 1, "information": {}, "locked_fields": {}, "events": [{"type": "update", "fqid": "user/1", "fields": {"password":'
request_data="$request_data_prefix $hash}}]}"
docker-compose exec backend curl --header "Content-Type: application/json" -d "$request_data" http://datastore-writer:9011/internal/datastore/writer/write

echo "Done"
