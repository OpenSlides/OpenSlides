#!/bin/bash

set -e

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

checkout_meta() {
    (
        local SUBMODULE=$1

        info "Checking out meta in $SUBMODULE"

        cd meta || exit 1

        echocmd git fetch

        if ! git branch --list | grep -v "HEAD" | grep -q "$META_LOCAL_BRANCH_NAME"
        then
            echocmd git switch -c "$META_LOCAL_BRANCH_NAME" "$META_BRANCH"
        else
            success "Branch $META_LOCAL_BRANCH_NAME already exists"
            echocmd git checkout "$META_LOCAL_BRANCH_NAME"
        fi
        echocmd git pull
    )
}

checkout() {
    (
        local SUBMODULE=$1
        local SOURCE=$2
        local BRANCH=$3
        local ISMAIN=$4

        cd $SUBMODULE || exit 1

        if [ -n "$ISMAIN" ]; then SUBMODULE="OpenSlides"; fi

        info "Fetch & checkout for ${SUBMODULE} "
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

        echocmd git fetch

        if ! git branch --list | grep -v "HEAD" | grep -q "$BRANCH"
        then
            echocmd git switch -t "$SOURCE"/"$BRANCH"
        else
            success "Branch $BRANCH already exists"
            echocmd git checkout "$BRANCH"
        fi

        echocmd git pull

        if [ -d "meta" ]; then checkout_meta "$SUBMODULE"; fi
    )
}

checkout_main()
{
    (
        ask y "Would you like to checkout main repository as well? WARNING: You may not be able to call this script again after switching branches, as it may not exist in target branch" || exit 0

        checkout . upstream feature/relational-db true
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

echo "Checking out rel DB"

META_BRANCH=origin/feature/relational-db
META_LOCAL_BRANCH_NAME=feature/relational-db

# Go
(
    cd lib || exit 1
    checkout openslides-go origin feature/relational-db
)

# Services
checkout openslides-auth-service        luisa-beerboom  rel-db
checkout openslides-autoupdate-service  upstream        feature/relational-db
checkout openslides-backend             rrenkert        readd-script-call
checkout openslides-client              bastianjoel     new-vote-service
checkout openslides-datastore-service   upstream        main
checkout openslides-icc-service         upstream        feature/relational-db
checkout openslides-manage-service      Janmtbehrens    feature/relational-db
checkout openslides-media-service       upstream        main
checkout openslides-proxy               upstream        main
checkout openslides-search-service      Janmtbehrens    feature/relational-db
checkout openslides-vote-service        upstream        feature/relational-db

# Setup localprod
setup_localprod

# Main
checkout_main

