#!/bin/sh

set -e

# Default service hosts and ports
export ACTION_HOST="${ACTION_HOST:-backend}"
export ACTION_PORT="${ACTION_PORT:-9002}"
export PRESENTER_HOST="${PRESENTER_HOST:-backend}"
export PRESENTER_PORT="${PRESENTER_PORT:-9003}"
export AUTOUPDATE_HOST="${AUTOUPDATE_HOST:-autoupdate}"
export AUTOUPDATE_PORT="${AUTOUPDATE_PORT:-9012}"
export ICC_HOST="${ICC_HOST:-icc}"
export ICC_PORT="${ICC_PORT:-9007}"
export AUTH_HOST="${AUTH_HOST:-auth}"
export AUTH_PORT="${AUTH_PORT:-9004}"
export SEARCH_HOST="${SEARCH_HOST:-search}"
export SEARCH_PORT="${SEARCH_PORT:-9050}"
export MEDIA_HOST="${MEDIA_HOST:-media}"
export MEDIA_PORT="${MEDIA_PORT:-9006}"
export MANAGE_HOST="${MANAGE_HOST:-manage}"
export MANAGE_PORT="${MANAGE_PORT:-9008}"
export CLIENT_HOST="${CLIENT_HOST:-client}"
export CLIENT_PORT="${CLIENT_PORT:-9001}"
export VOTE_HOST="${VOTE_HOST:-vote}"
export VOTE_PORT="${VOTE_PORT:-9013}"

# Create dynamic configuration with environment variables
cat > /etc/traefik/dynamic/dynamic.yml << EOF
# Dynamic configuration for OpenSlides services
http:
  routers:
    # Autoupdate service (WebSocket/SSE)
    autoupdate:
      rule: "PathPrefix(\`/system/autoupdate\`)"
      service: autoupdate
      entryPoints:
        - websecure
      
    # Presenter service
    presenter:
      rule: "PathPrefix(\`/system/presenter\`)"
      service: presenter
      entryPoints:
        - websecure
        
    # Search service
    search:
      rule: "PathPrefix(\`/system/search\`)"
      service: search
      entryPoints:
        - websecure
        
    # Action service
    action:
      rule: "PathPrefix(\`/system/action\`)"
      service: action
      entryPoints:
        - websecure
        
    # Media service
    media:
      rule: "PathPrefix(\`/system/media\`)"
      service: media
      entryPoints:
        - websecure
        
    # Auth service
    auth:
      rule: "PathPrefix(\`/system/auth\`) || PathPrefix(\`/system/saml\`)"
      service: auth
      entryPoints:
        - websecure
        
    # ICC service (WebSocket)
    icc:
      rule: "PathPrefix(\`/system/icc\`)"
      service: icc
      entryPoints:
        - websecure
        
    # Vote service
    vote:
      rule: "PathPrefix(\`/system/vote\`)"
      service: vote
      entryPoints:
        - websecure
        
    # Manage service (gRPC)
    manage:
      rule: "Header(\`Content-Type\`, \`application/grpc\`)"
      service: manage
      entryPoints:
        - websecure
        
    # Client (default/fallback)
    client:
      rule: "PathPrefix(\`/\`)"
      service: client
      entryPoints:
        - websecure
      priority: 1
        
  services:
    # Autoupdate service
    autoupdate:
      loadBalancer:
        servers:
          - url: "http://${AUTOUPDATE_HOST}:${AUTOUPDATE_PORT}"
        passHostHeader: true
        
    # Presenter service  
    presenter:
      loadBalancer:
        servers:
          - url: "http://${PRESENTER_HOST}:${PRESENTER_PORT}"
        passHostHeader: true
        
    # Search service
    search:
      loadBalancer:
        servers:
          - url: "http://${SEARCH_HOST}:${SEARCH_PORT}"
        passHostHeader: true
        
    # Action service
    action:
      loadBalancer:
        servers:
          - url: "http://${ACTION_HOST}:${ACTION_PORT}"
        passHostHeader: true
        
    # Media service
    media:
      loadBalancer:
        servers:
          - url: "http://${MEDIA_HOST}:${MEDIA_PORT}"
        passHostHeader: true
        
    # Auth service
    auth:
      loadBalancer:
        servers:
          - url: "http://${AUTH_HOST}:${AUTH_PORT}"
        passHostHeader: true
        
    # ICC service
    icc:
      loadBalancer:
        servers:
          - url: "http://${ICC_HOST}:${ICC_PORT}"
        passHostHeader: true
        
    # Vote service
    vote:
      loadBalancer:
        servers:
          - url: "http://${VOTE_HOST}:${VOTE_PORT}"
        passHostHeader: true
        
    # Manage service (gRPC with h2c)
    manage:
      loadBalancer:
        servers:
          - url: "h2c://${MANAGE_HOST}:${MANAGE_PORT}"
        passHostHeader: true
        
    # Client service
    client:
      loadBalancer:
        servers:
          - url: "http://${CLIENT_HOST}:${CLIENT_PORT}"
        passHostHeader: true
EOF

# Handle HTTPS configuration for local development
if [ -n "$ENABLE_LOCAL_HTTPS" ]; then
  HTTPS_CERT_FILE="${HTTPS_CERT_FILE:-/certs/cert.pem}"
  HTTPS_KEY_FILE="${HTTPS_KEY_FILE:-/certs/key.pem}"
  
  if [ -f "$HTTPS_CERT_FILE" ] && [ -f "$HTTPS_KEY_FILE" ]; then
    cat >> /etc/traefik/dynamic/dynamic.yml << EOF

# TLS configuration for local development
tls:
  certificates:
    - certFile: ${HTTPS_CERT_FILE}
      keyFile: ${HTTPS_KEY_FILE}
      stores:
        - default
  stores:
    default:
      defaultCertificate:
        certFile: ${HTTPS_CERT_FILE}
        keyFile: ${HTTPS_KEY_FILE}
EOF
    
    # Update traefik.yml to enable HTTPS
    cat > /etc/traefik/traefik.yml << EOF
# Traefik configuration for OpenSlides with HTTPS
api:
  dashboard: true
  debug: true

entryPoints:
  websecure:
    address: ":8000"
    http:
      tls: true

providers:
  file:
    directory: /etc/traefik/dynamic
    watch: true

log:
  level: ${TRAEFIK_LOG_LEVEL:-INFO}

accessLog: {}

serversTransport:
  insecureSkipVerify: true
EOF
  else
    echo "ERROR: no local cert-files provided. Did you run make-localhost-cert.sh?"
    exit 1
  fi
fi

# Execute traefik
exec "$@"