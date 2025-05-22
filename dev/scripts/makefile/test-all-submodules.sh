#!/bin/bash
# Iterates all submodules and executes the make-target 'run-tests'
# Ignores meta directory

# Parameter #1: Name of a submodule. If given, this function will exclusively test the given submodule and ignore all others

# This script runs a command in every registered submodule parallel
# Credits go to https://stackoverflow.com/a/70418086

export SINGLE_TARGET=$1

declare -A outputs

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
    # Extract submodule name
    cd "$DIR" && \
    export DIRNAME=${PWD##*/} && \
    export SUBMODULE=${DIRNAME//"openslides-"} && \
    if [ $SUBMODULE == 'meta' ]; then continue; fi && \

    # Check for single target
    if [ $# -eq 1 ]; then if [[ $SINGLE_TARGET != $SUBMODULE ]]; then continue; fi; fi && \

    # Execute test
    printf '\n Testing submodule %s \n' "${SUBMODULE}" && \
    export ERROR_FOUND="" &&\
    make "run-tests" || export ERROR_FOUND="1" && \
    outputs[$SUBMODULE]="${?}${ERROR_FOUND}" && \
    printf '\n Done testing submodule %s \n' "${SUBMODULE}"
done

printf "\n\n --- Overview --- \n\n"

for x in "${!outputs[@]}"; do
    export VALUE=${outputs[${x}]} && \
    export RESULT="Success" && \
    if [ $VALUE != '0' ]; then export RESULT="!!! Failure"; fi && \
    printf '%s for submodule %s \n' "${RESULT}" "${x}"
done

echo $outputs
wait