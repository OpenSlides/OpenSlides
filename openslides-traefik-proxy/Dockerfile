ARG CONTEXT=prod

FROM traefik:v3.0 as base

## Setup
ARG CONTEXT
WORKDIR /app
ENV APP_CONTEXT=${CONTEXT}

# Copy configuration files
COPY traefik.yml /etc/traefik/traefik.yml
COPY dynamic.yml /etc/traefik/dynamic/dynamic.yml
COPY entrypoint.sh /entrypoint.sh
COPY certs /certs

# Make entrypoint executable
RUN chmod +x /entrypoint.sh

## External Information
LABEL org.opencontainers.image.title="OpenSlides Traefik Proxy"
LABEL org.opencontainers.image.description="The Traefik proxy is the entrypoint for traffic going into an OpenSlides instance."
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/OpenSlides/OpenSlides/tree/main/openslides-traefik-proxy"

## Command
ENTRYPOINT ["/entrypoint.sh"]
CMD ["traefik"]

# Development Image
FROM base as dev

ENV ENABLE_LOCAL_HTTPS=1
ENV TRAEFIK_LOG_LEVEL=DEBUG

# Testing Image
FROM base as tests

# Production Image
FROM base as prod

# Add appuser
RUN adduser --system --no-create-home appuser && \
    chown -R appuser /app/ && \
    chown -R appuser /etc/traefik/

USER appuser