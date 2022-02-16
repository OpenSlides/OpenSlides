#!/bin/bash
# This script runs a command in every registered submodule parallel
# Credits go to https://stackoverflow.com/a/70418086

if [ -z "$1" ]; then
    echo "Missing Command" >&2
    exit 1
fi

COMMAND="$@"

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
    printf "\n\"${DIR}\": \"${COMMAND}\" started!\n" \
    && \
    cd "$DIR" \
    && \
    eval "$COMMAND" \
    && \
    printf "\"${DIR}\": \"${COMMAND}\" finished!\n" \
    &
done
wait