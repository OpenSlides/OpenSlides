#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")/util.sh"

SINGLE_TARGET=$1

# This uses Hadolint (https://github.com/hadolint/hadolint) to lint all Service Dockerfiles
# Pull Hadolint
docker pull ghcr.io/hadolint/hadolint

# Call Hadolint on each Submodule dockerfile
LOCAL_PWD=$(dirname "$0")


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

        # Execute test
        info " Linting Dockerfile for ${name}:"
        docker run --rm -i -v /"${LOCAL_PWD}"/.hadolint.yaml:/.config/hadolint.yaml ghcr.io/hadolint/hadolint < Dockerfile
    )
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait
