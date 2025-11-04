#!/bin/bash

set -e

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

checkout_meta() {
    (
        local SUBMODULE=$1

        info "Checking out meta in $SUBMODULE"

        cd meta || exit 1

        echocmd git fetch origin

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

        cd $SUBMODULE || exit 1

        info "Fetch & checkout for ${SUBMODULE} "
        if [[ ! "$SOURCE" == "upstream" && ! "$SOURCE" == "origin" ]]
        then
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
        echocmd git fetch "$SOURCE"

        if ! git branch --list | grep -v "HEAD" | grep -q "$BRANCH"
        then
            echocmd git switch -c "$BRANCH" "$SOURCE"/"$BRANCH"
        else
            success "Branch $BRANCH already exists"
            echocmd git checkout "$BRANCH"
        fi

        echocmd git pull

        if [ -d "meta" ]; then checkout_meta "$SUBMODULE"; fi
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
checkout openslides-manage-service      upstream        main
checkout openslides-media-service       upstream        main
checkout openslides-proxy               upstream        main
checkout openslides-search-service      Janmtbehrens    feature/relational-db
checkout openslides-vote-service        upstream        feature/relational-db


# Create localprod
(
    cd "$(dirname "$0")"/../../localprod || exit 1

    ls -a

    exit 0
    ./openslides setup .
    ./openslides config --config config.yml .

)
