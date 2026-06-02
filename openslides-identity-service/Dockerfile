ARG CONTEXT=prod

FROM golang:1.26.1-alpine AS base

## Setup
ARG CONTEXT

WORKDIR /app/openslides-identity-service
ENV APP_CONTEXT=${CONTEXT}

## Install
RUN apk add git --no-cache

COPY go.mod go.sum ./
RUN go mod download

COPY . .

## External Information
EXPOSE 9012

## Healthcheck
HEALTHCHECK curl --fail http://localhost:8083/system/identity/health/

## Command
COPY ./dev/command.sh ./
RUN chmod +x command.sh
CMD ["./command.sh"]

# Development Image
FROM base AS dev

RUN ["go", "install", "github.com/githubnemo/CompileDaemon@latest"]

# Test Image
FROM base AS tests

COPY dev/container-tests.sh ./dev/container-tests.sh

RUN apk add --no-cache \
    build-base \
    docker && \
    go get -u github.com/ory/dockertest/v3 && \
    go install golang.org/x/lint/golint@latest && \
    chmod +x dev/container-tests.sh

## Command
STOPSIGNAL SIGKILL

# Production Image

FROM base AS builder
RUN go build

FROM scratch AS prod

## Setup
ARG CONTEXT
ENV APP_CONTEXT=prod

LABEL org.opencontainers.image.title="OpenSlides Autoupdate Service"
LABEL org.opencontainers.image.description="The Autoupdate Service is a http endpoint where the clients can connect to get the current data and also updates."
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/OpenSlides/openslides-autoupdate-service"

COPY --from=builder /app/openslides-autoupdate-service/openslides-autoupdate-service /

EXPOSE 9012
ENTRYPOINT ["/openslides-autoupdate-service"]


HEALTHCHECK CMD ["/openslides-autoupdate-service", "health"]
