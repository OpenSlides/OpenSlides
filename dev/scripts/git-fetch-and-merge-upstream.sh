#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")/util.sh"

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

while read -r toplevel sm_path name; do
# Extract submodule name
  {
    # Extract submodule name
    DIR="$toplevel/$sm_path"

    [[ "$name" == 'openslides-meta' ]] && continue
    [[ "$name" == 'openslides-go' ]] && continue

    # Check for single target
    [[ "$SINGLE_TARGET" != "" ]] && [[ "openslides-$SINGLE_TARGET" != "$name" ]] && continue

    (
        cd "./$name" || exit 1
        # Recursively Update Meta too
        update_meta

        # Git commit
        fetch_merge_push "${name}" "${SOURCE_REPOSITORY}" "${SOURCE_BRANCH}"
    )
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait
