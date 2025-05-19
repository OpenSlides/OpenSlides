#!/bin/bash
# Iterates all submodules and executes the make-target 'build-aio' using parameter context as build target
# Ignores meta directory

# Parameter #1: Name of a submodule. If given, this function will exclusively build the given submodule and ignore all others

# This script runs a command in every registered submodule parallel
# Credits go to https://stackoverflow.com/a/70418086

export CONTEXT=$1

if [ -z "$1" ]; then
    echo "No build context specified. Building for dev per default." >&2
    export CONTEXT="dev"
fi

export SINGLE_TARGET=$1

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
    # Extract submodule name
    cd "$DIR" && \
    export DIRNAME=${PWD##*/} && \
    export SUBMODULE=${DIRNAME//"openslides-"} && \
    if [ $SUBMODULE == 'meta' ]; then continue; fi && \
    if [ $SUBMODULE == 'go' ]; then continue; fi && \

    # Check for single target
    if [ -n $SINGLE_TARGET ]; then if [[ $SINGLE_TARGET != $SUBMODULE ]]; then continue; fi; fi && \

    # Execute test
    printf '\n --- Building submodule %s for context %s --- \n' "${SUBMODULE}" "${CONTEXT}" && \
    eval "make build-aio submodule=${SUBMODULE} context=${CONTEXT} > /dev/null"
done
wait