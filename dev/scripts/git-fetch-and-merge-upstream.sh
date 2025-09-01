#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh"

# Fetches and merges all submodules with their respective SOURCE_REPOSITORY/SOURCE_BRANCH repositories. Default is upstream/main

SOURCE_REPOSITORY=$1
SOURCE_BRANCH=$2
SINGLE_TARGET=$3

if [ -z "$SOURCE_REPOSITORY" ]; then SOURCE_REPOSITORY="upstream"; fi
if [ -z "$SOURCE_BRANCH" ]; then SOURCE_BRANCH="main"; fi

fetch_merge_push() {
    local SUBMODULE=$1
    local SOURCE=$2
    local BRANCH=$3

    info "Fetch & merge for ${SUBMODULE} "

    GIT_UPDATE=$(git remote update "$SOURCE")
    local GIT_UPDATE
    GIT_FETCH=$(git fetch "$SOURCE")
    local GIT_FETCH

    local ERROR=0
    git merge --no-edit "$SOURCE"/"$BRANCH" || local ERROR=1

    if [ "$SOURCE" == 'origin' ]; then return; fi

    if [ "$ERROR" == 1 ]; then (git commit && git push) ; fi
    if [ "$ERROR" == 0 ]; then (git push) ; fi
}

update_meta(){
    if [ -d "meta" ]
    then
        (
            cd meta || exit 1
            (fetch_merge_push meta origin)
        )
    fi
}

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
    # Extract submodule name
    cd "$DIR" || exit 1

    DIRNAME=${PWD##*/}
    SUBMODULE=${DIRNAME//"openslides-"}

    if [ "$SUBMODULE" == 'go' ]; then continue; fi
    if [ "$SUBMODULE" == 'meta' ]; then continue; fi

    # Check for single target
    if [ -n "$SINGLE_TARGET" ] && [ "$SINGLE_TARGET" != "$SUBMODULE" ]; then continue; fi

    # Recursively Update Meta too
    update_meta

    # Git commit
    fetch_merge_push "${SUBMODULE}" "${SOURCE_REPOSITORY}" "${SOURCE_BRANCH}"
done
wait
