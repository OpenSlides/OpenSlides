#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh"

# Checksout main and all submodules to given upstream branch

export BRANCH=$1
export SINGLE_TARGET=$2

checkout_main() {
    cd meta || exit 1

    git checkout main
    git pull
}

checkout() {
    export BRANCH=$1

    HEADS=$(git ls-remote --heads)
    if ! $(echo "$HEADS" | grep -q "refs/heads/$BRANCH"); then error "$BRANCH does not exist" && exit 1; fi

    echocmd git switch "$BRANCH"

    if [ -d "meta" ]; then checkout_main; fi
}

checkout "${BRANCH}"

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
    # Extract submodule name
    cd "$DIR" || exit 1

    DIRNAME=${PWD##*/}
    export DIRNAME
    SUBMODULE=${DIRNAME//"openslides-"}
    export SUBMODULE

    if [ "$SUBMODULE" == 'go' ]; then continue; fi
    if [ "$SUBMODULE" == 'meta' ]; then continue; fi

    # Check for single target
    if [ $# -eq 2 ]; then if [[ "$SINGLE_TARGET" != "$SUBMODULE" ]]; then continue; fi; fi

    # Git checkout
    checkout "${BRANCH}"
done
wait
