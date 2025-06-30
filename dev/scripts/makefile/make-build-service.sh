#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used in Makefile Targets of Services to build images for a specific context
help ()
{
    info "\
Builds service images for given context. Intended to be called from Makefiles

Parameters:
    #1 TARGET       : Name of the Makefile Target that called this script.
    #2 SERVICE      : Name of the Service that called this script. If empty, the main repository assumed to be the caller

Available run-dev functions:
    build-help          : Print help
    build-dev           : Builds development images
    build-tests         : Builds test images
    build-prod / build  : Builds production images
    "
}

# Setup
TARGET=$1
SERVICE=$2

LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

PREFIX="build-"
FUNCTION=${TARGET#"$PREFIX"}

# - Warnings
if [ -z "${TARGET}" ]; then
    warn "No makefile target specified. Building for prod per default." >&2
fi

# - Error Catching
if [ -z "$SERVICE" ]
then
    if [ "$FUNCTION" = "help" ]
    then
        help
        exit 0
    fi
    error "Build requires the name of the Service that needs to be build (Parameter #2)"
    exit 1
fi

info "Building $FUNCTION for Service $SERVICE"

# - Run specific function
case "$FUNCTION" in
"help")        help ;;
"dev")         echocmd bash "$LOCAL_PWD"/build-service.sh "$SERVICE" dev ;;
"tests")       echocmd bash "$LOCAL_PWD"/build-service.sh "$SERVICE" tests ;;
*)             echocmd bash "$LOCAL_PWD"/build-service.sh "$SERVICE" prod ;;
esac