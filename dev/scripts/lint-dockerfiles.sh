#!/bin/bash

export SINGLE_TARGET=$1

# This uses Hadolint (https://github.com/hadolint/hadolint) to lint all Service Dockerfiles
# Pull Hadolint
docker pull ghcr.io/hadolint/hadolint

# Call Hadolint on each Submodule dockerfile
LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
    # Extract submodule name
    cd "$DIR" && \
    export DIRNAME=${PWD##*/} && \
    export SUBMODULE=${DIRNAME//"openslides-"} && \
    if [ $SUBMODULE == 'meta' ]; then continue; fi && \
    if [ $SUBMODULE == 'go' ]; then continue; fi && \

    # Check for single target
    if [ $# -eq 1 ]; then if [[ $SINGLE_TARGET != $SUBMODULE ]]; then continue; fi; fi && \

    # Execute test
    printf '\n Linting Dockerfile for %s \n' "${SUBMODULE}" && \
    export ERROR_FOUND="" &&\
    (docker run --rm -i -v /${LOCAL_PWD}/.hadolint.yaml:/.config/hadolint.yaml ghcr.io/hadolint/hadolint < Dockerfile) || export ERROR_FOUND="1" && \
    printf '\n Done linting Dockerfile for %s \n' "${SUBMODULE}"
done

wait