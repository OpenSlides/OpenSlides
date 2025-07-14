#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh"

# Checksout main and all submodules to given upstream branch

export BRANCH=$1
export SINGLE_TARGET=$2

checkout() {
    export BRANCH=$2

    if git ls-remote --exit-code --heads upstream "$BRANCH"
    then
        echocmd git switch -c "$BRANCH" --track upstream/"$BRANCH"
    else
        error "upstream/$BRANCH does not exist"
        exit 1
    fi
}

checkout "${BRANCH}"

exit 1
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

    # Git checkout
    checkout "${BRANCH}"
done
wait