#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used in Makefile Targets to build images for a specific context
# Parameter #1: Makefile Target that called this script

help ()
{
    info "\
Builds service images for given context. Intended to be called from Makefiles

Parameters:
    #1 TARGET       : Name of the Makefile Target that called this script.

Available run-dev functions:
    build-help          : Print help
    build-dev           : Builds development images
    build-tests         : Builds test images
    build-prod / build  : Builds production images
    "
}

# Setup
TARGET=$1

PREFIX="run-dev-"
FUNCTION=${TARGET#"$PREFIX"}

# - Warnings
if [ -z "${TARGET}" ]; then
    warn "No makefile target specified. Building for prod per default." >&2
fi

# - Run specific function
case "$FUNCTION" in
"help")        help ;;
"dev")         echocmd bash build-service.sh $(SERVICE) dev ;;
"tests")       echocmd bash build-service.sh $(SERVICE) tests ;;
*)             echocmd bash build-service.sh $(SERVICE) prod ;;
esac