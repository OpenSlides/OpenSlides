#!/bin/bash

set -e

echo "Enter entrypoint.sh"

# Ensure Keycloak Database
until pg_isready -h ${KEYCLOAK_DATABASE_HOST} -p ${KEYCLOAK_DATABASE_PORT} -U ${KEYCLOAK_DATABASE_USER} -d ${KEYCLOAK_DATABASE_NAME} >/dev/null 2>&1; do
    sleep 2
    echo "Waiting for DB $KEYCLOAK_DATABASE_HOST to be ready - pg_isready check"
done

if ! psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -tc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'keycloak'" | grep -q 1; then
  psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "CREATE SCHEMA keycloak"
fi


# Config realm-export.json

edit_realm_export()
{
    # Changes KEY in realm-export.json to VALUE. If no VALUE is given, KEY is taken as default instead
    local KEY="${1:-}"
    local VALUE="${2:-KEY}"
    sed -i "s|$KEY|$VALUE|g" /opt/keycloak/data/import/realm-export.json
}

## Domain
edit_realm_export "localhost" "$KCS_INSTANCE_URL"
edit_realm_export "noreply@openslides.com" "$KCS_HOST_EMAIL"


# Start Keycloak
/opt/keycloak/bin/kc.sh start-dev --import-realm &

# Wait for Keycloak to be ready
until /opt/keycloak/bin/kcadm.sh config credentials \
  --server "http://${KCS_INSTANCE_URL}:8080" \
  --realm master \
  --user "$KC_BOOTSTRAP_ADMIN_USERNAME" \
  --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" 2>/dev/null; do
  echo "Waiting for keycloak server to setup"
  sleep 3
done

echo "Keycloak is ready"

# Add email to master admin

# Set admin email
ADMIN_USER=$(/opt/keycloak/bin/kcadm.sh get users -r master --query username="$KC_BOOTSTRAP_ADMIN_USERNAME" --fields id --format csv --noquotes)
/opt/keycloak/bin/kcadm.sh update users/"$ADMIN_USER" -r master -s email="$KCS_HOST_EMAIL"

exec "$@"
