ARG CONTEXT=prod

FROM registry.access.redhat.com/ubi9 AS build-tools
RUN mkdir -p /mnt/rootfs
RUN dnf install --installroot /mnt/rootfs postgresql --releasever 9 --setopt install_weak_deps=false --nodocs -y && \
    dnf --installroot /mnt/rootfs clean all && \
    rpm --root /mnt/rootfs -e --nodeps setup

FROM quay.io/keycloak/keycloak:26.6.0 AS build-keycloak

WORKDIR /opt/keycloak

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure a database vendor
ENV KC_DB=postgres

RUN /opt/keycloak/bin/kc.sh build


FROM quay.io/keycloak/keycloak:26.6.0 AS base

COPY --from=build-keycloak /opt/keycloak/ /opt/keycloak/

## Setup
ARG CONTEXT
WORKDIR /app
ENV APP_CONTEXT=${CONTEXT}

## Install
COPY ./entrypoint.sh ./entrypoint.sh
COPY conf/keycloak.conf /opt/keycloak/conf/keycloak.conf
COPY conf/realm-export.json /opt/keycloak/data/import/realm-export.json

## Allow changing of real-export.json
USER root
## PSQL
COPY --from=build-tools /mnt/rootfs /

ENTRYPOINT ["./entrypoint.sh"]

## Command
CMD ["sleep", "infinity"]

# Development Image
FROM base AS dev

ENV OPENSLIDES_DEVELOPMENT=1
