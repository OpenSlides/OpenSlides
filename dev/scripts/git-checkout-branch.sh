#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")/util.sh"

# Checksout main and all submodules to given upstream branch

BRANCH=$1
SINGLE_TARGET=$2

checkout_main() {
    cd meta || exit 1

    git checkout main
    git pull
}

checkout() {
    BRANCH=$1

    HEADS=$(git ls-remote --heads)
    if ! $(echo "$HEADS" | grep -q "refs/heads/$BRANCH"); then error "$BRANCH does not exist" && exit 1; fi

    echocmd git switch "$BRANCH"

    if [ -d "meta" ]; then checkout_main; fi
}

checkout "${BRANCH}"

while read -r toplevel sm_path name; do
# Extract submodule name
  {
    # Extract submodule name
    DIR="$toplevel/$sm_path"

    [[ "$name" == 'openslides-meta' ]] && continue
    [[ "$name" == 'openslides-go' ]] && continue

    # Check for single target
    [[ "$SINGLE_TARGET" != "" ]] && [[ "openslides-$SINGLE_TARGET" != "$name" ]] && continue

    # Git checkout
    (
        cd "./$name" || exit 1
        checkout "${BRANCH}"
    )
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait
