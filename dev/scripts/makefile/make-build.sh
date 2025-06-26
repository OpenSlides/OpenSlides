#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used in Makefile Targets to build images for a specific context
# Parameter #1: Makefile Target that called this script

TARGET=$1

if [ -z "${TARGET}" ]; then
    warn "No makefile target specified. Building for prod per default." >&2
fi

case "$TARGET" in
"build-dev")   echocmd bash build-service.sh $(SERVICE) dev ;;
"build-tests") echocmd bash build-service.sh $(SERVICE) tests ;;
*)             echocmd bash build-service.sh $(SERVICE) prod ;;
esac