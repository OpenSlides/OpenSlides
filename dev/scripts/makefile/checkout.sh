#!/bin/bash

set -e

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

REMOTE_NAME=origin
BRANCH_NAME=${1:-"main"}
BRANCH_FILE=${2:""}

BRANCH_FILE_PATH="/home/jmbehrens/OpenSlides/$(dirname "$0")"

if [ -f  "$BRANCH_FILE_PATH/$BRANCH_FILE" ]; then success "Reading commit info from $BRANCH_FILE"; fi

checkout() {
    (
        local DIRECTORY=$1
        local SUBMODULE=$2
        local SOURCE=${3:-origin}
        local BRANCH=${4:-main}
        local HASH=$5

        # Read from Branch File, if it exists
        if [[ -e "$BRANCH_FILE_PATH/$BRANCH_FILE" && ! -d "$BRANCH_FILE_PATH/$BRANCH_FILE" ]]
        then
            echo "$BRANCH_FILE_PATH/$BRANCH_FILE"
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

        cd $DIRECTORY || exit 1

        if [ -z "$SUBMODULE" ]; then SUBMODULE="OpenSlides"; fi

        info "Fetch & checkout for ${SUBMODULE} "

        # Check for changes and stash them if wanted.
        info "Check for changes..."

        if [ "$(git status --porcelain --ignore-submodules --untracked-files=no)" != "" ]
        then
            info "The repository has changes"
            success "$(git status --porcelain --ignore-submodules --untracked-files=no)"
            RESULT=$(ask y "Stash them?" </dev/tty || echo 1)
            if [ "$RESULT" == 0 ]
            then
                git stash
            else
                warn "$SUBMODULE was not stashed. Skipped instead"
                exit 0
            fi
        fi

        if [[ ! "$SOURCE" == "upstream" && ! "$SOURCE" == "origin" ]]
        then
            info "Source is a non origin or upstream remote, likely a fork"
            if ! git remote get-url "$SOURCE" >/dev/null 2>&1
            then
                echocmd git remote add "$SOURCE" git@github.com:"$SOURCE"/"$SUBMODULE".git
            else
                echocmd git remote set-url "$SOURCE" git@github.com:"$SOURCE"/"$SUBMODULE".git
                success "Remote $SOURCE already exists"
            fi
        else
            echocmd git remote set-url "$SOURCE" git@github.com:OpenSlides/"$SUBMODULE".git
        fi

        # Fetch
        echocmd git fetch "$SOURCE"

        # Switch Branch
        if ! git branch --list | grep -v "HEAD" | grep -q "$BRANCH"
        then
            echocmd git switch -t "$SOURCE"/"$BRANCH"
        else
            success "Branch $BRANCH already exists"
            echocmd git checkout "$BRANCH"
        fi

        # Pull
        echocmd git pull --ff-only

        # Force reset to a hash, if one hasc "meta" "met been provided
        # Ignore specific hash, if latest should be pulled
        if [ -n "$CHECKOUT_LATEST" ]; then local HASH=""; fi

        if [ -n "$HASH" ]
        then
            git reset --hard "$HASH"
        fi;

        # Switch meta too, if present
        if [ -d "meta" ]; then checkout "meta" "openslides-meta" "$REMOTE_NAME" "$BRANCH_NAME" ""; fi
    )
}

checkout_main()
{
    (
        ask y "Would you like to checkout main repository as well? WARNING: You may not be able to call this script again after switching branches, as it may not exist in target branch" || exit 0

        checkout "" "OpenSlides" "$RENAME_NAME" "$BRANCH_NAME" ""
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


# Checkout latest branches

while read -r toplevel sm_path name; do
  {
    # Extract submodule name
    DIR="$toplevel/$sm_path"

    [[ "$name" == 'openslides-meta' ]] && continue

    (
        info "Checking out $name"

        if [ "$name" == 'openslides-go' ]; then cd lib || abort 1; fi

        cd "./$name" || exit 1

        checkout "$DIR" "$name" "$REMOTE_NAME" "$BRANCH_NAME"
    )
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"
wait

while getopts ":h:help:c" o; do
    case "${o}" in
        h | help)
            usage
            exit 0
            ;;
        c)
            CHECKOUT_LATEST=true
            ;;
        *)
            usage
            exit 0
            ;;
    esac
done

# Setup localprod
#setup_localprod

# Main
#checkout_main

