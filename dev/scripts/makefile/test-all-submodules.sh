#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Iterates all submodules and executes the make-target 'run-tests'
# Ignores meta directory

# Parameter #1: Name of a submodule. If given, this function will exclusively test the given submodule and ignore all others

# This script runs a command in every registered submodule parallel
# Credits go to https://stackoverflow.com/a/70418086

export SINGLE_TARGET=$1

declare -A outputs

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
    if [ $# -eq 1 ]; then if [[ "$SINGLE_TARGET" != "$SUBMODULE" ]]; then continue; fi; fi && \

    # Execute test
    info "Testing service ${SUBMODULE}" && \
    export ERROR_FOUND="" &&\
    echocmd make run-tests || export ERROR_FOUND="1" && \
    outputs[$SUBMODULE]="${?}${ERROR_FOUND}"
done

for x in "${!outputs[@]}"; do
    VALUE=${outputs[${x}]}
    export VALUE && \
    if [ "$VALUE" != '0' ]; then error "Tests for service ${x} failed"; fi && \
    if [ "$VALUE" == '0' ]; then success "Tests for service ${x} successful"; fi \
    &
done

wait
