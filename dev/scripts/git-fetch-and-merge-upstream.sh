#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh"

# Fetches and merges all submodules with their respective upstream/main repositories.

export SINGLE_TARGET=$1

fetch_merge_push() {
    export SUBMODULE=$1
    export SOURCE=$2

    info "Fetch & merge for ${SUBMODULE} " 

    GIT_UPDATE=$(git remote update "$SOURCE")
    export GIT_UPDATE
    GIT_FETCH=$(git fetch "$SOURCE")
    export GIT_FETCH

    export ERROR=0
    git merge "$SOURCE"/main || export ERROR=1 

    if [ "$SOURCE" == 'origin' ]; then return; fi

    if [ "$ERROR" == 1 ]; then (git commit && git push) ; fi 
    if [ "$ERROR" == 0 ]; then (git push) ; fi 
}

update_meta(){
    if [ -d "meta" ] 
    then 
        (
            cd meta || exit
            (fetch_merge_push meta origin) 
        )
    fi 
}


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

    # Recursively Update Meta too
    update_meta && \

    # Git commit
    fetch_merge_push "${SUBMODULE}" upstream
done
wait