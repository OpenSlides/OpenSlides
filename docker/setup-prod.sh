#!/bin/bash

# Create keys for auth, if they do not exist
if [ ! -f secrets/auth_token_key ]; then
    tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64 > secrets/auth_token_key
fi
if [ ! -f secrets/auth_cookie_key ]; then
    tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64 > secrets/auth_cookie_key
fi

( set -a; source .env; m4 docker-compose.yml.m4 ) > docker-compose.yml
( set -a; source .env; m4 docker-stack.yml.m4 ) > docker-stack.yml
