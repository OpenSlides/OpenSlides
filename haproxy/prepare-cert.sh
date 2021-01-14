#!/bin/bash

set -e
cd "$(dirname "$0")"

# check, if we already generated a cert
combined="src/combined.pem"

if [[ ! -f $combined ]]; then
    echo "Creating certificates..."
    cd src
    if type 2>&1 >/dev/null openssl ; then
      echo "Using openssl to generate a certificate."
      echo "You will need to accept an security exception for the"
      echo "generated certificate in your browser manually."
      openssl req -x509 -newkey rsa:4096 -nodes -days 3650 \
              -subj "/C=DE/O=Selfsigned Test/CN=localhost" \
              -keyout localhost-key.pem -out localhost.pem
    else
      echo >&2 "FATAL: No valid certificate generation tool found!"
      exit -1
    fi
    cat localhost.pem localhost-key.pem > combined.pem
    echo "done"
else
    echo "Certificate exists."
fi