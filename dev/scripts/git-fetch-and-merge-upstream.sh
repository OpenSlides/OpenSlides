#!/bin/bash

# Import OpenSlides utils package
. $( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh

# Fetches and merges all submodules with their respective upstream/main repositories.

export SINGLE_TARGET=$1

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
    # Extract submodule name
    cd "$DIR" && \
    export DIRNAME=${PWD##*/} && \
    export SUBMODULE=${DIRNAME//"openslides-"} && \

    if [ $SUBMODULE == 'go' ]; then continue; fi && \
    if [ $SUBMODULE == 'meta' ]; then continue; fi && \

    # Check for single target
    if [ $# -eq 2 ]; then if [[ $SINGLE_TARGET != $SUBMODULE ]]; then continue; fi; fi && \

    # Git commit
    info "Fetch & merge for ${SUBMODULE} " && \
    git fetch upstream && \
    export error=0 && \
    git merge upstream/main || export error=1 && \
    if [ $error -eq 1 ]; then (git commit && git push) ; fi && \
    if [ $error -eq 0 ]; then (git push) ; fi
done
wait