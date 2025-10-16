#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")/util.sh"

# Commits and pushes all submodules to their respective repositories.
# The same Commit Message is reused for all Commits
# Use this for blanket changes to all submodules that are the same between all submodules, such as
# Dockerfile changes that need to be applied to all submodules

export MESSAGE=$1

if [ -z "${MESSAGE}" ]; then
    error "Enter a Commit Message" >&2
    exit 1
fi

export SINGLE_TARGET=$2

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

        # Git commit
        info "Commit & push for ${name} "
        git add -u .
        git commit -a -m "$MESSAGE"
        git push
    )
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait
