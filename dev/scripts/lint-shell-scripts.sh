#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")/util.sh"

SINGLE_TARGET=$1

lint_all_files() {
    # Finds all files with a valid shebang at the beginning. Grep outputs the filename as well as the shebang itself.
    # The shebang is cut out so that only the filename remains. This filename is then used as an input parameter for shellcheck
    find . -type f -exec grep -EH '^#!(.*/|.*env +)(sh|bash|ksh)' {} \; | cut -d: -f1 | xargs shellcheck
}

# This uses Shellcheck (https://github.com/koalaman/shellcheck) to lint all Service shell-scripts as well as the dev folder

# Call Shellcheck on each Submodule shell-scripts
(
    LOCAL_PWD=$(dirname "$0")
    cd "$LOCAL_PWD"/.. || exit
    info " Linting shell-scripts for dev:"
    lint_all_files
)

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
        info " Linting shell-scripts for ${name}:"
        lint_all_files
    )
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait
