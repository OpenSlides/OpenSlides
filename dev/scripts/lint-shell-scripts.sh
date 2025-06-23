#!/bin/bash

# Import OpenSlides utils package
. $( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh

export SINGLE_TARGET=$1

lint_all_files() {
    # Finds all files with a valid shebang at the beginning. Grep outputs the filename as well as the shebang itself. 
    # The shebang is cut out so that only the filename remains. This filename is then used as an input parameter for shellcheck
    find . -type f -exec grep -EH '^#!(.*/|.*env +)(sh|bash|ksh)' {} \; | cut -d: -f1 | xargs shellcheck
    info $?
}

# This uses Shellcheck (https://github.com/koalaman/shellcheck) to lint all Service Dockerfiles

# Call Shellcheck on each Submodule shell-scripts
LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

IFS=$'\n'
for DIR in $(git submodule foreach --recursive -q sh -c pwd); do
    # Extract submodule name
    cd "$DIR" && \
    export DIRNAME=${PWD##*/} && \
    export SUBMODULE=${DIRNAME//"openslides-"} && \
    if [ $SUBMODULE == 'meta' ]; then continue; fi && \
    if [ $SUBMODULE == 'go' ]; then continue; fi && \

    # Check for single target
    if [ $# -eq 1 ]; then if [[ $SINGLE_TARGET != $SUBMODULE ]]; then continue; fi; fi && \

    # Execute test
    info " Linting shell-scripts for ${SUBMODULE}:" && \
    lint_all_files
done

wait