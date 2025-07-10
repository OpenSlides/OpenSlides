FROM ubuntu:22.04

ARG SUBDIRECTORY=openslides-autoupdate-service

# Setup
WORKDIR /app/

# Copy .git from main repository (context is assumed to be inside a service repository)
COPY ./.git .git

WORKDIR /app/submodule/

# Installs
RUN apt-get update && \
    apt-get install -y curl git docker unzip

RUN curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Copy repository content
COPY ./${SUBDIRECTORY} .

CMD [ "sleep" , "infinity" ]