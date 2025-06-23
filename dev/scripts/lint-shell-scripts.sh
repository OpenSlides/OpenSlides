#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/util.sh"

export SINGLE_TARGET=$1

lint_all_files() {
    # Finds all files with a valid shebang at the beginning. Grep outputs the filename as well as the shebang itself. 
    # The shebang is cut out so that only the filename remains. This filename is then used as an input parameter for shellcheck
    find . -type f -exec grep -EH '^#!(.*/|.*env +)(sh|bash|ksh)' {} \; | cut -d: -f1 | xargs shellcheck
}

# This uses Shellcheck (https://github.com/koalaman/shellcheck) to lint all Service shell-scripts as well as the dev folder

# Call Shellcheck on each Submodule shell-scripts
(
    LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
    cd "$LOCAL_PWD"/.. || exit
    info " Linting shell-scripts for dev:" && \
    lint_all_files
)

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
    if [ $# -eq 1 ]; then if [[ "$SINGLE_TARGET" != "$SUBMODULE" ]]; then continue; fi; fi && \

    # Execute test
    info " Linting shell-scripts for ${SUBMODULE}:" && \
    lint_all_files
done

wait