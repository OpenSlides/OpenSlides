#!/bin/bash

ADMIN_USERNAME=${1-admin}
ADMIN_PASSWORD=${2-admin}

migrate_user()
{
    local ADMIN_KEY=$1
    local USERNAME=$2
    local PASSWORD=$3
    local EMAIL=$4

    if [ -z "$EMAIL" ]
    then
        EMAIL="$USERNAME@missing-email.com"
    fi

    # Uploading user $USERNAME with Email $EMAIL to Keycloak
    KEYCLOAK_RESPONSE="$(curl -s -i \
        -X POST "${KEYCLOAK_URL_INTERNAL}/admin/realms/${KEYCLOAK_OS_REALM}/users" \
        -H "Authorization: Bearer ${ADMIN_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
        \"username\": \"${USERNAME}\",
        \"email\": \"${EMAIL}\",
        \"enabled\": true
        }")"

    # Get ID from response
    STATUS_CODE=$(awk 'NR==1 {print $2}' <<< "$KEYCLOAK_RESPONSE")
    KEYCLOAK_USER_ID=$(awk -F/ '/^Location:/ {print $NF}' <<< "$KEYCLOAK_RESPONSE")

    if [ "$STATUS_CODE" == "409" ]
    then
        # User already exists
        KEYCLOAK_USER_ID=$(
            curl -s \
                -G "${KEYCLOAK_URL_INTERNAL}/admin/realms/${KEYCLOAK_OS_REALM}/users" \
                -H "Authorization: Bearer ${ADMIN_KEY}" \
                --data-urlencode "username=${USERNAME}" \
            | jq -r '.[0].id')

        #TODO: Update email of existing username"
    elif [ "$STATUS_CODE" != "201" ]
    then
        # Some error occured
        echo "Error trying to create or find user in keycloak database:"
        echo "$KEYCLOAK_RESPONSE"
        exit 0
    fi

    if [ -n "$KEYCLOAK_USER_ID" ]
    then
        curl -s \
        -X PUT "${KEYCLOAK_URL_INTERNAL}/admin/realms/${KEYCLOAK_OS_REALM}/users/${KEYCLOAK_USER_ID}/reset-password" \
        -H "Authorization: Bearer ${ADMIN_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"password\",
            \"temporary\": false,
            \"value\": \"${PASSWORD}\"
        }"
    fi

    echo "$KEYCLOAK_USER_ID"
}

update_os_user()
{
    USERNAME=$1
    EMAIL=$2
    KEYCLOAK_ID=$3

    psql -U "$POSTGRES_DB" -c "UPDATE TABLE ;" >/dev/null 2>&1
    psql -h ${KEYCLOAK_DATABASE_HOST} -p ${KEYCLOAK_DATABASE_PORT} -U ${KEYCLOAK_DATABASE_USER} -d ${KEYCLOAK_DATABASE_NAME} \
        -c "UPDATE user_t SET keycloak_id = '$KEYCLOAK_ID' WHERE username = '$USERNAME';" >/dev/null
}

# Get keycloak admin token
KEYCLOAK_ADMIN_TOKEN_RESPONSE=$(curl -s -d "client_id=admin-cli" -d "username=${ADMIN_USERNAME}" -d "password=${ADMIN_PASSWORD}" -d "grant_type=password" \
        "${KEYCLOAK_URL_INTERNAL}/realms/${KEYCLOAK_OS_REALM}/protocol/openid-connect/token")
ADMIN_KEY=$(echo "$KEYCLOAK_ADMIN_TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$ADMIN_KEY" == "null" ]
then
    echo "Error getting keycload admin key:"
    echo "$KEYCLOAK_ADMIN_TOKEN_RESPONSE"
    exit 0
fi

# Wait for Database to get ready
until pg_isready -h ${KEYCLOAK_DATABASE_HOST} -p ${KEYCLOAK_DATABASE_PORT} -U ${KEYCLOAK_DATABASE_USER} -d ${KEYCLOAK_DATABASE_NAME} >/dev/null 2>&1; do
    sleep 2
    echo "Waiting for DB $POSTGRES_DB to be ready - pg_isready check"
done
until psql -h ${KEYCLOAK_DATABASE_HOST} -p ${KEYCLOAK_DATABASE_PORT} -U ${KEYCLOAK_DATABASE_USER} -d ${KEYCLOAK_DATABASE_NAME} -c "SELECT 1" >/dev/null 2>&1; do
    sleep 2
    echo "Waiting for DB $POSTGRES_DB to be ready - communications check"
done

psql -h ${KEYCLOAK_DATABASE_HOST} -p ${KEYCLOAK_DATABASE_PORT} -U ${KEYCLOAK_DATABASE_USER} -d ${KEYCLOAK_DATABASE_NAME} -AtF $'\t' -c "SELECT username, password, email FROM user_t;" |
while IFS=$'\t' read -r username password email; do
    if [ "$username" == "admin" ]
    then
        continue
    fi

    KEYCLOAK_ID=$(migrate_user "$ADMIN_KEY" "$username" "$password" "$email")

    update_os_user "$username" "$email" "$KEYCLOAK_ID"
done

echo "Done!"
