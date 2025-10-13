#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

# Iterates all submodules and executes the make-target 'run-tests'
# Ignores meta and go directory

# Parameter #1: Name of a submodule. If given, this function will exclusively test the given submodule and ignore all others

SINGLE_TARGET=$1

# Remove ARGS flag from calling maketarget
MAKEFLAGS=
unset ARGS

declare -A outputs

# For some bizarre reason, the wait-for-it call in auth-service causes the loop below to break
# Therefore it is tested seperately
(
  [[ "$SINGLE_TARGET" != "" ]] && [[ "openslides-$SINGLE_TARGET" != "openslides-auth-service" ]] && exit 0
  ERROR_FOUND=""
  echocmd make -C "openslides-auth-service" run-tests || ERROR_FOUND="1"
  outputs["auth-service"]="${?}${ERROR_FOUND}"
)

echo ${outputs["auth-service"]}
while read -r toplevel sm_path name; do
# Extract submodule name
  {
    DIR="$toplevel/$sm_path"

    # Skip Meta
    [[ "$name" == 'openslides-meta' ]] && continue
    [[ "$name" == 'openslides-go' ]] && continue
    [[ "$name" == 'openslides-auth-service' ]] && continue

    # Check for single target
    [[ "$SINGLE_TARGET" != "" ]] && [[ "openslides-$SINGLE_TARGET" != "$name" ]] && continue

    # Execute test
    (
      ERROR_FOUND=""
      echocmd make -C "$DIR" run-tests || ERROR_FOUND="1"
      outputs[$name]="${?}${ERROR_FOUND}"
    )
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"

echo "Done"
# This part needs to be reworked. Since tests now run in subshells, outputs remains empty / only changes within the subshell
for x in "${!outputs[@]}"; do
    VALUE=${outputs[${x}]}
    if [ "$VALUE" != '0' ]; then error "Tests for service ${x} failed"; fi
    if [ "$VALUE" == '0' ]; then success "Tests for service ${x} successful"; fi
done


