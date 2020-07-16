#!/bin/bash

set -e
cd "$(dirname "$0")"

# check, if we already generated a cert
combined="src/combined.pem"

if [[ ! -f $combined ]]; then
    echo "Creating certificates..."
    cd src
    mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1
    cat localhost.pem localhost-key.pem > combined.pem
    echo "done"
else
    echo "Certificate exists."
fi
