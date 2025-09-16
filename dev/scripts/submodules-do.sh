#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")"/util.sh

# This script runs a command in every registered submodule parallel
# Ignores openslides-meta and openslides-go submodules

if [ -z "$1" ]; then
    echo "Missing Command" >&2
    exit 1
fi

# Parameters
while getopts "q" FLAG; do
    case "${FLAG}" in
    q) QUIET=true && shift 1;;
    *) echo "Can't parse flag ${FLAG}" && break ;;
    esac
done

COMMAND="$*"

while read -r toplevel sm_path; do
# Extract submodule name
  {
    DIR="${toplevel}${sm_path}"
    (
        [[ "$sm_path" == 'lib/openslides-go' ]] && exit 0
        [[ "$sm_path" == 'meta' ]] && exit 0

        [[ -z "$QUIET" ]] && info "Command started: ${sm_path}: ${COMMAND}"

        cd "$sm_path" || exit 1
        eval "$COMMAND"

        COMMAND_STATUS="$?"

        [[ -z "$QUIET" ]] &&  [[ "$COMMAND_STATUS" != 0 ]] && error "Command error: ${sm_path}: ${COMMAND}"
        [[ -z "$QUIET" ]] &&  [[ "$COMMAND_STATUS" == 0 ]] && success "Command finished: ${sm_path}: ${COMMAND}"
    )
  } &
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path"')"
wait
