#!/bin/bash

ADMIN_USERNAME=
ADMIN_PASSWORD=
POSTGRES_DB=

admin_key()
{
    ADMIN_KEY=0

    echo "$ADMIN_KEY"
}

migrate_user()
{
    USERNAME=$1
    PASSWORD=$2
    EMAIL=$3

    KEYCLOAK_ID=0

    echo "$KEYCLOAK_ID"
}

update_os_user()
{
    USERNAME=$1
    EMAIL=$2
    KEYCLOAK_ID=$3

    psql -U "$POSTGRES_DB" -c "UPDATE TABLE ;" >/dev/null 2>&1
}

# Wait for Database to get ready
until pg_isready -U "$POSTGRES_DB" >/dev/null 2>&1; do
    sleep 3
    echo "Waiting for DB $POSTGRES_DB to be ready - pg_isready check"
done
until psql -U "$POSTGRES_DB" -c "SELECT 1" >/dev/null 2>&1; do
    sleep 3
    echo "Waiting for DB $POSTGRES_DB to be ready - communications check"
done
