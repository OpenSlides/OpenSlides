#!/bin/sh

if [ "$APP_CONTEXT" = "dev" ]; then exec CompileDaemon -log-prefix=false -build="go build" -command="./openslides-identity-service"; fi
if [ "$APP_CONTEXT" = "tests" ]; then sleep inf; fi
