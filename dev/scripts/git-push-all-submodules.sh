#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh"

# Commits and pushes all submodules to their respective repositories.
# The same Commit Message is reused for all Commits
# Use this for blanket changes to all submodules that are the same between all submodules, such as 
# Dockerfile changes that need to be applied to all submodules

export MESSAGE=$1

if [ -z "${MESSAGE}" ]; then
    error "Enter a Commit Message" >&2
    exit 1
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

    if [ "$SUBMODULE" == 'go' ]; then continue; fi && \
    if [ "$SUBMODULE" == 'meta' ]; then continue; fi && \

    # Check for single target
    if [ $# -eq 2 ]; then if [[ "$SINGLE_TARGET" != "$SUBMODULE" ]]; then continue; fi; fi && \

    # Git commit
    info "Commit & push for ${SUBMODULE} " && \
    git add -u . && \
    git commit -a -m "$MESSAGE" && \
    git push 
done
wait