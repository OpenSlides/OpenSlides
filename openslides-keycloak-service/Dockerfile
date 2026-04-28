ARG CONTEXT=prod

FROM python:3.10.19-slim-bookworm AS base

## Setup
ARG CONTEXT
WORKDIR /app
ENV APP_CONTEXT=${CONTEXT}

## Install
COPY . .

RUN apt-get -y update &&  apt-get -y upgrade && apt-get install --no-install-recommends -y \
    curl \
    jq \
    libpq-dev \
    postgresql-client \
    python3-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r "requirements.txt"

## Command
CMD ["sleep", "infinity"]

# Development Image
FROM base AS dev

ENV OPENSLIDES_DEVELOPMENT=1
