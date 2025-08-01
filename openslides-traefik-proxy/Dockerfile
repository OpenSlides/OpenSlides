ARG CONTEXT=prod

FROM traefik:v3.0 as base

## Setup
ARG CONTEXT
WORKDIR /app
ENV APP_CONTEXT=${CONTEXT}

# Install required packages based on context
RUN apk add --no-cache curl bash

# Copy configuration files
COPY traefik.yml /etc/traefik/traefik.yml
COPY entrypoint.sh /entrypoint.sh
COPY certs /certs
COPY ./dev/command.sh ./

# Create dynamic config directory and make scripts executable
RUN mkdir -p /etc/traefik/dynamic && \
    chmod +x /entrypoint.sh && \
    chmod +x ./command.sh

## External Information
LABEL org.opencontainers.image.title="OpenSlides Traefik Proxy"
LABEL org.opencontainers.image.description="The Traefik proxy is the entrypoint for traffic going into an OpenSlides instance."
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/OpenSlides/OpenSlides/tree/main/openslides-traefik-proxy"

## Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8000/ping || exit 1

## Command
ENTRYPOINT ["/entrypoint.sh"]
CMD ["./command.sh"]

# Development Image
FROM base as dev

ENV ENABLE_LOCAL_HTTPS=1
ENV TRAEFIK_LOG_LEVEL=DEBUG

# Testing Image
FROM base as tests

# Production Image
FROM base as prod

# Add appuser for security
RUN adduser -S -D -H appuser && \
    chown -R appuser:appuser /app/ && \
    chown -R appuser:appuser /etc/traefik/ && \
    chown appuser:appuser /entrypoint.sh && \
    chown appuser:appuser ./command.sh

USER appuser