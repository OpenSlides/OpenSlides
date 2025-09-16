#!/bin/bash

set -e

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

# Iterates all submodules and executes the make-target 'build-aio' using parameter context as build target
# Ignores meta and openslides-go directory


CONTEXT=$1
shift 1
ARGS="${*}"

if [ "${CONTEXT}" != "prod" ] && [ "${CONTEXT}" != "dev" ] && [ "${CONTEXT}" != "tests" ]; then
    warn "No build context specified. Building for prod per default."
    CONTEXT="prod"
fi

info "Building image(s) for context $CONTEXT"

while read -r toplevel sm_path name; do
# Extract submodule name
  {
    DIR="$toplevel/$sm_path"

    [[ "$name" == 'openslides-go' ]] && exit 0
    [[ "$name" == 'openslides-meta' ]] && exit 0

    # Execute test
    echo " --- Building service ${name} for context ${CONTEXT} --- "

    echo "end sleep"
    echocmd make -C "$DIR" build-"${CONTEXT}" ARGS="$ARGS"
  } &
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait
