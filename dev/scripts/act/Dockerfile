FROM ubuntu:22.04

ARG SUBDIRECTORY=openslides-autoupdate-service

# Setup
WORKDIR /app/

# Copy .git from main repository (context is assumed to be inside a service repository)
COPY ./.git .git

WORKDIR /app/submodule/

# Installs
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
    curl \
    docker \
    git \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Copy repository content
COPY ./${SUBDIRECTORY} .

CMD [ "sleep" , "infinity" ]