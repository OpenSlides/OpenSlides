#!/bin/bash

# Create keys for auth, if they do not exist
if [ ! -d keys ]; then
    mkdir keys

    ssh-keygen -f keys/rsa-token.key -t rsa -b 2048 -P ""
    ssh-keygen -f keys/rsa-cookie.key -t rsa -b 2048 -P ""
fi

( set -a; source .env; m4 docker-compose.yml.m4 ) > docker-compose.yml
