#!/bin/bash

# Import OpenSlides utils package
. $( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh

# Commits and pushes all submodules to their respective repositories.
# The same Commit Message is reused for all Commits
# Use this for blanket changes to all submodules that are the same between all submodules, such as 
# Dockerfile changes that need to be applied to all submodules

export OVERWRITE_MESSAGE=$1
export MESSAGE="Merge Upstream"
if [ ! -z "${OVERWRITE_MESSAGE}" ]; then
    export MESSAGE=$OVERWRITE_MESSAGE
fi

export SINGLE_TARGET=$2

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