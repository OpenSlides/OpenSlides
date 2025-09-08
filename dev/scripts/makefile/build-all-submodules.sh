#!/bin/bash

set -e

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Iterates all submodules and executes the make-target 'build-aio' using parameter context as build target
# Ignores meta and openslides-go directory


export CONTEXT=$1
shift 1
export ARGS="${@}"

if [ "${CONTEXT}" != "prod" ] && [ "${CONTEXT}" != "dev" ] && [ "${CONTEXT}" != "tests" ]; then
    warn "No build context specified. Building for prod per default."
    export CONTEXT="prod"
fi

info "Building image(s) for context $CONTEXT"


# Andere art des loops
while read -r toplevel sm_path name; do
# Extract submodule name
  {
    DIR="$toplevel/$sm_path"

    [[ "$name" == 'openslides-go' ]] && continue
    [[ "$name" == 'openslides-meta' ]] && continue

    # Execute test
    echo " --- Building service ${SUBMODULE} for context ${CONTEXT} --- "

    echo "end sleep"
    echocmd make -C $DIR build-"${CONTEXT}" ARGS="$ARGS"
  } &
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait
