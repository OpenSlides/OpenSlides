ARG CONTEXT=prod

FROM golang:1.26.1-alpine AS base

## Setup
ARG CONTEXT

WORKDIR /app/openslides-identity-service
ENV APP_CONTEXT=${CONTEXT}

## Install
RUN apk add --no-cache \
    curl \
    git

COPY go.mod go.sum ./
RUN go mod download

COPY main.go main.go
COPY internal internal

## External Information
EXPOSE 9014

## Healthcheck
HEALTHCHECK CMD curl --fail http://localhost:9014/system/identity/health/

## Command
COPY ./dev/command.sh ./
RUN chmod +x command.sh
CMD ["./command.sh"]

# Development Image
FROM base AS dev

RUN ["go", "install", "github.com/githubnemo/CompileDaemon@latest"]

# Test Image
FROM base AS tests

RUN apk add --no-cache \
    build-base

CMD go vet ./... && go test -test.short ./...

## Command
STOPSIGNAL SIGKILL

# Production Image

FROM base AS builder
RUN go build

FROM scratch AS prod

## Setup
ARG CONTEXT
ENV APP_CONTEXT=prod

LABEL org.opencontainers.image.title="OpenSlides Identity Service"
LABEL org.opencontainers.image.description="The Identity Service is a http endpoint where the clients can connect to get OpenSlides User IDs."
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/OpenSlides/openslides-identity-service"

COPY --from=builder /app/openslides-identity-service/openslides-identity-service /

EXPOSE 9012
ENTRYPOINT ["/openslides-identity-service"]


HEALTHCHECK CMD curl --fail http://localhost:9014/system/identity/health/
