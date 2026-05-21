#!/bin/bash

set -e

echo "Enter entrypoint.sh"

echo "$KC_BOOTSTRAP_ADMIN_USERNAME $KC_BOOTSTRAP_ADMIN_PASSWORD $KC_HOSTNAME"

# Start Keycloak
/opt/keycloak/bin/kc.sh start-dev --import-realm &

# Wait for Keycloak to be ready
until /opt/keycloak/bin/kcadm.sh config credentials \
  --server "$KC_HOSTNAME" \
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
echo "$ADMIN_USER"
/opt/keycloak/bin/kcadm.sh update users/"$ADMIN_USER" -r master -s email=noreply@openslides.com

exec "$@"
