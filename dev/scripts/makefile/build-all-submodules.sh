#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Iterates all submodules and executes the make-target 'build-aio' using parameter context as build target
# Ignores meta directory

# Parameter #1: Name of a submodule. If given, this function will exclusively build the given submodule and ignore all others

# This script runs a command in every registered submodule parallel
# Credits go to https://stackoverflow.com/a/70418086

export CONTEXT=$1

if [ "${CONTEXT}" != "prod" ] && [ "${CONTEXT}" != "dev" ] && [ "${CONTEXT}" != "tests" ]; then
    warn "No build context specified. Building for prod per default." >&2
    export CONTEXT="prod"
fi

export SINGLE_TARGET=$2

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
   # Extract submodule name
    cd "$DIR" || exit && \

    DIRNAME=${PWD##*/} && \
    export DIRNAME && \
    SUBMODULE=${DIRNAME//"openslides-"} && \
    export SUBMODULE && \

    if [ "$SUBMODULE" == 'meta' ]; then continue; fi && \

    # Check for single target
    if [ $# -eq 2 ]; then if [[ "$SINGLE_TARGET" != "$SUBMODULE" ]]; then continue; fi; fi && \

    # Execute test
    info " --- Building service ${SUBMODULE} for context ${CONTEXT} --- " && \
    echocmd make build-"${CONTEXT}" \
    &
done
wait
