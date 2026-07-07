#!/bin/sh
# Bootstrap script: creates the OIDC application in Zitadel and uploads
# the logo as instance branding.  Runs once after Zitadel is healthy;
# subsequent runs are no-ops (idempotent via the client-id sentinel file).

ZITADEL_URL="${ZITADEL_INTERNAL_URL:-http://zitadel-api:8080}"
# Zitadel resolves the tenant instance by matching the Host header against the
# registered external domain.  The instance is bootstrapped with
# ZITADEL_EXTERNALDOMAIN / ZITADEL_EXTERNALPORT, so every curl call must send
# that host (default: localhost:8080) instead of the internal docker hostname.
ZITADEL_EXTERNAL_HOST="${ZITADEL_EXTERNAL_HOST:-localhost:8080}"
PAT_FILE="/zitadel/bootstrap/admin.pat"
CLIENT_ID_FILE="/zitadel/bootstrap/client-id"
PROJECT_ID_FILE="/zitadel/bootstrap/project-id"
APP_ID_FILE="/zitadel/bootstrap/app-id"
LOGO_FILE="/logos/logo-192.png"
FAVICON_FILE="/logos/favicon.ico"

REDIRECT_URI="${ZITADEL_REDIRECT_URI:-http://localhost:8080/api/auth/callback}"
POST_LOGOUT_URI="${APP_REDIRECT_URL:-http://localhost}"

# ---------------------------------------------------------------------------
# Wait for the admin PAT written by Zitadel's start-from-init
# ---------------------------------------------------------------------------
echo "Waiting for admin PAT at $PAT_FILE ..."
i=0
while [ ! -s "$PAT_FILE" ]; do
    i=$((i + 1))
    if [ $i -ge 60 ]; then
        echo "ERROR: timed out waiting for $PAT_FILE" >&2
        exit 1
    fi
    sleep 2
done

PAT="$(cat "$PAT_FILE")"
echo "Admin PAT loaded: $PAT"

sleep 5
# ---------------------------------------------------------------------------
# Idempotency / staleness check
# ---------------------------------------------------------------------------
# If all three sentinel files exist, verify that the OIDC app is still
# present in Zitadel and fetch the *live* client_id.  Writing the live
# value back to the file ensures the backend always has the correct ID,
# even if the file was stale (e.g. after a Postgres wipe without removing
# this volume, or after manually deleting the app in the Zitadel console).
# If the app (or its parent project) is gone, all sentinel files are
# removed and we fall through to a full re-bootstrap below.
# ---------------------------------------------------------------------------
if [ -s "$PROJECT_ID_FILE" ] && [ -s "$APP_ID_FILE" ] && [ -s "$CLIENT_ID_FILE" ]; then
    SAVED_PROJECT_ID="$(cat "$PROJECT_ID_FILE")"
    SAVED_APP_ID="$(cat "$APP_ID_FILE")"
    LIVE_RESP=$(curl -sf \
            -H "Authorization: Bearer $PAT" \
            -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
            "${ZITADEL_URL}/management/v1/projects/${SAVED_PROJECT_ID}/apps/${SAVED_APP_ID}/oidc" \
            2>/dev/null || true)
    LIVE_CLIENT_ID=$(printf '%s' "$LIVE_RESP" | jq -r '.app.oidcConfig.clientId // empty' 2>/dev/null || true)
    if [ -n "$LIVE_CLIENT_ID" ]; then
        # App verified – refresh the client_id file from the live API value.
        printf '%s' "$LIVE_CLIENT_ID" > "$CLIENT_ID_FILE"
        echo "App verified (client ID: $LIVE_CLIENT_ID). Updating OIDC app config ..."
        # Always PUT the current redirect URIs so that changing ZITADEL_REDIRECT_URI
        # (e.g. migrating from port 80 to port 8080) takes effect automatically on
        # the next docker-compose up without requiring a manual bootstrap wipe.
        if curl -sf \
                -X PUT \
                -H "Authorization: Bearer $PAT" \
                -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
                -H "Content-Type: application/json" \
                -d "{
                    \"redirectUris\": [\"${REDIRECT_URI}\"],
                    \"responseTypes\": [\"OIDC_RESPONSE_TYPE_CODE\"],
                    \"grantTypes\": [\"OIDC_GRANT_TYPE_AUTHORIZATION_CODE\"],
                    \"appType\": \"OIDC_APP_TYPE_WEB\",
                    \"authMethodType\": \"OIDC_AUTH_METHOD_TYPE_NONE\",
                    \"postLogoutRedirectUris\": [\"${POST_LOGOUT_URI}\"],
                    \"version\": \"OIDC_VERSION_1_0\",
                    \"devMode\": true,
                    \"accessTokenType\": \"OIDC_TOKEN_TYPE_BEARER\",
                    \"accessTokenRoleAssertion\": false,
                    \"idTokenRoleAssertion\": false,
                    \"idTokenUserinfoAssertion\": true,
                    \"clockSkew\": \"0s\"
                }" \
                "${ZITADEL_URL}/management/v1/projects/${SAVED_PROJECT_ID}/apps/${SAVED_APP_ID}/oidc" \
                > /dev/null 2>&1; then
            echo "OIDC app config updated (redirect URI: ${REDIRECT_URI})."
        else
            echo "WARN: OIDC app config update failed (non-fatal). Existing URIs remain active."
        fi
        echo "Bootstrap up to date."
        exit 0
    fi
    echo "WARN: App not found in Zitadel (stale bootstrap data). Re-bootstrapping..."
    rm -f "$CLIENT_ID_FILE" "$PROJECT_ID_FILE" "$APP_ID_FILE"
fi

# Remove any partial artifacts left by a previous failed run so the backend
# can never pick up a stale client_id while setup is still in progress.
rm -f "$CLIENT_ID_FILE" "$APP_ID_FILE"

# ---------------------------------------------------------------------------
# Upload instance logo (light and dark variants) and favicon
# ---------------------------------------------------------------------------
# Logo assets are served through the dedicated /assets/v1 handler, not the
# admin/v1 gRPC-gateway.  The paths are:
#   POST /assets/v1/instance/policy/label/logo       (light theme logo)
#   POST /assets/v1/instance/policy/label/logo/dark  (dark theme logo)
#   POST /assets/v1/instance/policy/label/icon       (light theme favicon)
#   POST /assets/v1/instance/policy/label/icon/dark  (dark theme favicon)
# After uploading, the preview policy must be activated via the admin API:
#   POST /admin/v1/policies/label/_activate          (note the underscore)
# ---------------------------------------------------------------------------
if [ -f "$LOGO_FILE" ]; then
    echo "Uploading logo (light) ..."
    if LOGO_RESP=$(curl -f \
            -X POST \
            -H "Authorization: Bearer $PAT" \
            -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
            -F "file=@${LOGO_FILE};type=image/png" \
            "${ZITADEL_URL}/assets/v1/instance/policy/label/logo" 2>&1); then
        echo "Logo (light) uploaded"
    else
        echo "WARN: logo (light) upload failed (non-fatal): $LOGO_RESP"
    fi

    # Dark-theme logo: use logo-dark.png when present, otherwise reuse logo.png.
    echo "Uploading logo (dark) ..."
    if LOGO_DARK_RESP=$(curl -f \
            -X POST \
            -H "Authorization: Bearer $PAT" \
            -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
            -F "file=@${LOGO_FILE};type=image/png" \
            "${ZITADEL_URL}/assets/v1/instance/policy/label/logo/dark" 2>&1); then
        echo "Logo (dark) uploaded"
    else
        echo "WARN: logo (dark) upload failed (non-fatal): $LOGO_DARK_RESP"
    fi

    # Favicon (light and dark): use the same icon for both themes.
    if [ -f "$FAVICON_FILE" ]; then
        echo "Uploading favicon (light) ..."
        if FAVICON_RESP=$(curl -f \
                -X POST \
                -H "Authorization: Bearer $PAT" \
                -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
                -F "file=@${FAVICON_FILE};type=image/x-icon" \
                "${ZITADEL_URL}/assets/v1/instance/policy/label/icon" 2>&1); then
            echo "Favicon (light) uploaded"
        else
            echo "WARN: favicon (light) upload failed (non-fatal): $FAVICON_RESP"
        fi
        echo "Uploading favicon (dark) ..."
        if FAVICON_DARK_RESP=$(curl -f \
                -X POST \
                -H "Authorization: Bearer $PAT" \
                -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
                -F "file=@${FAVICON_FILE};type=image/x-icon" \
                "${ZITADEL_URL}/assets/v1/instance/policy/label/icon/dark" 2>&1); then
            echo "Favicon (dark) uploaded"
        else
            echo "WARN: favicon (dark) upload failed (non-fatal): $FAVICON_DARK_RESP"
        fi
    else
        echo "WARN: favicon file not found at $FAVICON_FILE, skipping favicon upload."
    fi

    # Activate the label policy so the logo and favicon take effect.
    # The activate action uses a leading underscore in the URL segment.
    if curl -f \
            -X POST \
            -H "Authorization: Bearer $PAT" \
            -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
            -H "Content-Type: application/json" \
            -d '{}' \
            "${ZITADEL_URL}/admin/v1/policies/label/_activate"; then
        echo "Label policy activated."
    else
        echo "WARN: label policy activation failed (non-fatal)."
    fi
else
    echo "WARN: logo file not found at $LOGO_FILE, skipping logo upload."
fi


# ---------------------------------------------------------------------------
# Create (or reuse) the project
# ---------------------------------------------------------------------------
# If a project_id file already exists from a partial previous run, check
# whether that project still lives in Zitadel.  If it does, reuse it to
# avoid creating an orphaned duplicate project.
PROJECT_ID=""
if [ -s "$PROJECT_ID_FILE" ]; then
    SAVED_PROJECT_ID="$(cat "$PROJECT_ID_FILE")"
    if curl -sf \
            -H "Authorization: Bearer $PAT" \
            -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
            "${ZITADEL_URL}/management/v1/projects/${SAVED_PROJECT_ID}" > /dev/null 2>&1; then
        PROJECT_ID="$SAVED_PROJECT_ID"
        echo "Reusing existing project (ID: $PROJECT_ID)."
    else
        rm -f "$PROJECT_ID_FILE"
    fi
fi

if [ -z "$PROJECT_ID" ]; then
    echo "Creating project ..."
    PROJECT_RESP=$(curl -f \
        -X POST "${ZITADEL_URL}/zitadel.project.v2.ProjectService/CreateProject" \
        -H "Authorization: Bearer $PAT" \
        -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
        -H "Content-Type: application/json" \
        -H "Connect-Protocol-Version: 1" \
        -d '{
            "organizationId": "OpenSlides",
            "name": "app"
        }')

    PROJECT_ID=$(printf '%s' "$PROJECT_RESP" | jq -r '.projectId // empty')
    if [ -z "$PROJECT_ID" ]; then
        echo "ERROR: could not parse project ID from response: $PROJECT_RESP"
        exit 1
    fi
    printf '%s' "$PROJECT_ID" > "$PROJECT_ID_FILE"
    echo "project created (ID: $PROJECT_ID)."
fi

# ---------------------------------------------------------------------------
# Create the OIDC application (Authorization Code + PKCE, no secret)
# ---------------------------------------------------------------------------
echo "Creating OIDC application ... $PROJECT_ID"
APP_RESP=$(curl -f \
    -X POST "${ZITADEL_URL}/zitadel.application.v2.ApplicationService/CreateApplication" \
    -H "Authorization: Bearer $PAT" \
    -H "Host: ${ZITADEL_EXTERNAL_HOST}" \
    -H "Content-Type: application/json" \
    -H "Connect-Protocol-Version: 1" \
    -d "{
        \"applicationId\": \"OpenSlides\",
        \"projectIdd\": \"${PROJECT_ID}\",
        \"name\": \"app\",
        \"oidcConfiguration\": {
            \"redirectUris\": [\"${REDIRECT_URI}\"],
            \"responseTypes\": [\"OIDC_RESPONSE_TYPE_CODE\"],
            \"grantTypes\": [\"OIDC_GRANT_TYPE_AUTHORIZATION_CODE\"],
            \"appType\": \"OIDC_APP_TYPE_WEB\",
            \"authMethodType\": \"OIDC_AUTH_METHOD_TYPE_NONE\",
            \"postLogoutRedirectUris\": [\"${POST_LOGOUT_URI}\"],
            \"version\": \"OIDC_VERSION_1_0\",
            \"devMode\": true,
            \"accessTokenType\": \"OIDC_TOKEN_TYPE_BEARER\",
            \"accessTokenRoleAssertion\": false,
            \"idTokenRoleAssertion\": false,
            \"idTokenUserinfoAssertion\": true,
            \"clockSkew\": \"0s\"
        }
    }")

CLIENT_ID=$(printf '%s' "$APP_RESP" | jq -r '.clientId // empty')
APP_ID=$(printf '%s' "$APP_RESP" | jq -r '.appId // empty')
if [ -z "$CLIENT_ID" ] || [ -z "$APP_ID" ]; then
    echo "ERROR: could not parse clientId/appId from response: $APP_RESP" >&2
    exit 1
fi
echo "OIDC application created (App ID: $APP_ID, Client ID: $CLIENT_ID)."

# ---------------------------------------------------------------------------
# Persist the client ID so that the backend and future runs can use it
# ---------------------------------------------------------------------------
printf '%s' "$APP_ID" > "$APP_ID_FILE"
printf '%s' "$CLIENT_ID" > "$CLIENT_ID_FILE"
echo "Client ID written to $CLIENT_ID_FILE."
echo "Zitadel bootstrap complete."

