# OpenSlides Traefik Proxy Service

The OpenSlides Traefik proxy service is a reverse proxy based on [Traefik](https://traefik.io/) that routes all external traffic to the appropriate OpenSlides services.

## Overview

This service:
- Provides HTTPS termination with self-signed certificates for development
- Routes requests to appropriate microservices based on URL paths
- Handles WebSocket connections for real-time features
- Supports gRPC communication for the manage service

## Configuration

The proxy service is configured through:
- `traefik.yml` - Static configuration
- `entrypoint.sh` - Dynamic configuration generation based on environment variables

### Environment Variables

- `ENABLE_LOCAL_HTTPS` - Enable HTTPS with local certificates (default: 1 for dev)
- `TRAEFIK_LOG_LEVEL` - Log level (default: INFO)
- Service locations can be configured via `*_HOST` and `*_PORT` variables

### Routes

All routes are prefixed with `/system/`:
- `/system/action/*` → Backend action service
- `/system/presenter/*` → Backend presenter service  
- `/system/autoupdate/*` → Autoupdate service (WebSocket/SSE)
- `/system/auth/*`, `/system/saml/*` → Auth service
- `/system/media/*` → Media service
- `/system/search/*` → Search service
- `/system/vote/*` → Vote service
- `/system/icc/*` → ICC service (WebSocket)
- gRPC requests → Manage service
- `/*` → Client (default)

## Development

```bash
make build-dev
```

## Production

For production deployments, proper SSL certificates should be configured.

## License

This service is part of OpenSlides and licensed under the MIT license.