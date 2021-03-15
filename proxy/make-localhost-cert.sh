#!/bin/bash

set -e
cd "$(dirname "$0")"

if [[ -f "certs/key.pem" ]] || [[ -f "certs/cert.pem" ]]; then
    echo "Certificate already exists."
    exit 0
fi

if ! type 2>&1 >/dev/null openssl ; then
    echo >&2 "Error: openssl not found!"
    exit 1
fi

echo "Creating certificates..."
echo "You will need to accept an security exception for the"
echo "generated certificate in your browser manually."
openssl req -x509 -newkey rsa:4096 -nodes -days 3650 \
        -subj "/C=DE/O=Selfsigned Test/CN=localhost" \
        -keyout certs/key.pem -out certs/cert.pem
echo "done"
