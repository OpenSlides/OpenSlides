ARG CONTEXT=prod

FROM registry.access.redhat.com/ubi9 AS builder
RUN mkdir -p /mnt/rootfs
RUN dnf install --installroot /mnt/rootfs postgresql --releasever 9 --setopt install_weak_deps=false --nodocs -y && \
    dnf --installroot /mnt/rootfs clean all && \
    rpm --root /mnt/rootfs -e --nodeps setup

FROM quay.io/keycloak/keycloak:26.6.0 AS base

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
COPY --from=builder /mnt/rootfs /

ENTRYPOINT ["./entrypoint.sh"]

## Command
CMD ["sleep", "infinity"]

# Development Image
FROM base AS dev

ENV OPENSLIDES_DEVELOPMENT=1
