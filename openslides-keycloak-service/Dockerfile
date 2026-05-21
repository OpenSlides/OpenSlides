ARG CONTEXT=prod

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

ENTRYPOINT ["./entrypoint.sh"]

## Command
CMD ["sleep", "infinity"]

# Development Image
FROM base AS dev

ENV OPENSLIDES_DEVELOPMENT=1
