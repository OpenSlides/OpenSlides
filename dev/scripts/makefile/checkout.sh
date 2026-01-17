#!/bin/bash

set -eo pipefail

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

REMOTE_NAME=${1:-"upstream"}
BRANCH_NAME=${2:-"main"}
BRANCH_FILE=${3:-""}
OPT_PULL=${4:-0}
CHECKOUT_LATEST=${5:-0}

BRANCH_FILE_PATH=$(realpath ".")

if [ -f  "$BRANCH_FILE_PATH/$BRANCH_FILE" ]; then success "Reading commit info from $BRANCH_FILE"; fi

usage() {
  info "\

   USAGE BASH: $(basename "$0") [REMOTE_NAME:upstream] [BRANCH_NAME:main] [BRANCH_FILE] {-p -l}

   By default $(basename "$0") will fetch the latest changes for every
   submodule and directly checkout the $REMOTE_NAME's $BRANCH_NAME branch.
   This will leave them in detached HEAD state.

   Specify a branch layout file using BRANCH_FILE. Submodules will use values
   from this file to derive branch, remote and commit hash information
   The lines in this file have must have the following structure:

            [  module             remote     branch      commit_hash ]

   Example: [openslides-backend  upstream  feature/xyz        ""     ]
            (see dev/scripts/makefile/checkout_example_file for more)

   Use -p or --pull to instead forward the local $BRANCH_NAME branch.
   Use -l or --latest to ignore specific commit hashes and instead pull the latest commit.
   Use -g or --go_update to automatically update go.mod of all submodules to match the checked out openslides-go version

   USAGE MAKE: make checkout REMOTE= BRANCH= FILE= PULL= LATEST=

   REMOTE is a shorthand for REMOTE_NAME, BRANCH is for BRANCH_NAME, FILE for BRANCH_FILE, PULL for -p Flag and LATEST for -l

   All variables are optional
   "
}

go_update() {
    # only checkout when flag is set
    if [ -z "$GO_AUTO_CHECKOUT" ]
    then
        exit 0
    fi

    # Check if openslides-go is even part of the go.mod file
    if ! grep -q openslides-go "./go.mod" 2>/dev/null
    then
        exit 0
    fi

    # Set openslides-go in go.mod and go.sum of services to the current openslides-go hash
    local CUR_GO_SUBMODULE_VERSION="$(git -C . show "HEAD:go.mod" |
        awk '$1 ~ "/openslides-go" {print $2}' | tail -1 | awk -F- '{print $3}')"
    local GO_BRANCH_HASH="$(git -C "../lib/openslides-go" rev-parse "HEAD")"
    local GO_BRANCH_HASH_SHORT="$(git -C "../lib/openslides-go" rev-parse "HEAD" | cut -c1-12)"

    if [[ "$CUR_GO_SUBMODULE_VERSION" != "$GO_BRANCH_HASH_SHORT" ]]
    then
        warn "Cur: $CUR_GO_SUBMODULE_VERSION Go: $GO_BRANCH_HASH_SHORT"
        info "Updating go mod to $GO_BRANCH_HASH"
        go get github.com/OpenSlides/openslides-go@${GO_BRANCH_HASH}
        go mod tidy
    else
        exit 0
    fi
}

checkout() {
    (
        local DIRECTORY=$1
        local SUBMODULE=$2
        local SOURCE=${3:-upstream}
        local BRANCH=${4:-main}
        local HASH=$5

        # Read from Branch File, if it exists
        if [[ -e "$BRANCH_FILE_PATH/$BRANCH_FILE" && ! -d "$BRANCH_FILE_PATH/$BRANCH_FILE" ]]
        then
            while read -r MOD SRC BRCH HSH; do
                if [ "$MOD" == "$SUBMODULE" ]
                then
                    SOURCE="$SRC"
                    BRANCH="$BRCH"
                    HASH="${HSH//\"/}" # Strip " from hash
                    break
                fi
            done < "$BRANCH_FILE_PATH/$BRANCH_FILE"
        elif [ -n "$BRANCH_FILE" ]
        then
            warn "$BRANCH_FILE_PATH/$BRANCH_FILE not found"
        fi

        cd "$DIRECTORY" || exit 1

        if [ -z "$SUBMODULE" ]; then SUBMODULE="OpenSlides"; fi

        info "Fetch & checkout for ${SUBMODULE} "

        # Check for changes and stash them if wanted.
        info "Check for changes..."
        GIT_CHANGES=$(git status --porcelain --ignore-submodules --untracked-files=no)
        if [ "$GIT_CHANGES" != "" ]
        then
            info "The repository has changes"
            success "$GIT_CHANGES"

            ask y "Stash them?" </dev/tty && RESULT=$? || true

            if [ "$RESULT" == 0 ]
            then
                git stash
            else
                warn "$SUBMODULE was not stashed. Skipped instead"
                exit 0
            fi
        fi

        # Add non-origin/upstream remotes if necessary
        if [[ ! "$SOURCE" == "upstream" && ! "$SOURCE" == "origin" ]]
        then
            info "$SOURCE is a non origin or upstream remote"
            if ! git remote get-url "$SOURCE" >/dev/null 2>&1
            then
                echocmd git remote add "$SOURCE" git@github.com:"$SOURCE"/"$SUBMODULE".git
            else
                echocmd git remote set-url "$SOURCE" git@github.com:"$SOURCE"/"$SUBMODULE".git
                success "Remote $SOURCE already exists"
            fi
        else
            SOURCE=$(set_remote "upstream" "origin")
            echocmd git remote set-url "$SOURCE" git@github.com:OpenSlides/"$SUBMODULE".git
        fi

        # Fetch
        echocmd git fetch "$SOURCE"

        # Verify or set to main
        git rev-parse --verify remotes/"$SOURCE"/"$BRANCH" &>/dev/null || BRANCH=main

        if [ "$OPT_PULL" == 0 ]
        then
            # Only checkout in a detached head state
            echocmd git checkout "$SOURCE"/"$BRANCH"
        else
            # Pull and forward local branch
            # Switch Branch
            if ! git branch --list | grep -v "HEAD" | grep -q "$BRANCH"
            then
                echocmd git switch -t "$SOURCE"/"$BRANCH"
            else
                success "Branch $BRANCH already exists"
                echocmd git checkout "$BRANCH"
            fi

            # Pull
            echocmd git pull --ff-only "$SOURCE" "$BRANCH"
        fi

        # Force reset to a hash, if one has been provided
        # Ignore specific hash, if latest should be pulled
        if [ ! "$CHECKOUT_LATEST" = 0 ]; then local HASH=""; fi

        if [ -n "$HASH" ]
        then
           git reset --hard "$HASH"
        fi;

        # Switch meta too, if present
        if [ -d "meta" ]
        then
            checkout "meta" "openslides-meta" "$REMOTE_NAME" "$BRANCH_NAME" ""
        fi

        # Update go mod
        if [ -f "go.mod" ]
        then
            if [ "$SUBMODULE" != "openslides-go" ]
            then
                # Set go branch to openslides-go branch hash
                go_update
            fi
        fi
    )
}

checkout_main()
{
    (
        ask y "Would you like to checkout main repository as well? WARNING: You may not be able to call this script again after switching branches, as it may not exist in target branch" || exit 0

        checkout "." "OpenSlides" "$REMOTE_NAME" "$BRANCH_NAME" ""
    )
}

setup_localprod()
{
    (
        ask y "Setup localprod as well? WARNING: This will overwrite current localprod setup" || exit 0

        # Switching to manage and building openslides exe
        cd "$(dirname "$0")"/../../../openslides-manage-service || exit 1
        make openslides

        # Moving openslides to localprod directory
        mv ./openslides ../dev/localprod/openslides
        cd ../dev/localprod || exit 1

        # Setup and generate localprod docker compose
        ./openslides setup .
        ./openslides config --config config.yml .
    )
}

# Parse flags
if ! parsed=$(getopt -o plgh --long pull,latest,go_update,help -n "$(basename "$0")" -- "$@"); then
    usage
    exit 1
fi

eval set -- "$parsed"

while true; do
    case "$1" in
        -p|--pull)
            OPT_PULL=1
            shift
            ;;
        -l|--latest)
            CHECKOUT_LATEST=1
            shift
            ;;
        -g|--go_update)
            GO_AUTO_CHECKOUT=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        *)
            usage
            exit 1
            ;;
    esac
done

# Checkout latest branches

while read -r toplevel sm_path name; do
  {
    # Extract submodule name
    DIR="$toplevel/$sm_path"

    [[ "$name" == 'openslides-meta' ]] && continue

    (
        info "Checking out $name"

        if [ "$name" == 'openslides-go' ]
        then
            cd lib || abort 1
        fi

        cd "./$name" || exit 1

        checkout "$DIR" "$name" "$REMOTE_NAME" "$BRANCH_NAME"
    )
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait

# Setup localprod
setup_localprod

# Main
checkout_main

# Consistency Check
check_meta_consistency || warn "Consistency check failed"
check_go_consistency || warn "Consistency check failed"
info "Checking submodule initialization"
check_submodules_intialized || error "Submodules not initialized"

echo ""
success Done
