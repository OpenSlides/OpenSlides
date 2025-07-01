#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used in Makefile Targets of the main repository to build images for a specific context
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

PREFIX="build-"
FUNCTION=${TARGET#"$PREFIX"}

# - Warnings
if [ -z "${TARGET}" ]; then
    warn "No makefile target specified. Building for prod per default." >&2
fi

info "Building $FUNCTION"

# - Run specific function
case "$FUNCTION" in
"help")        help ;;
"dev")         echocmd bash build-all-submodules.sh dev ;;
"tests")       echocmd bash build-all-submodules.sh tests ;;
*)             echocmd bash build-all-submodules.sh prod ;;
esac