#!/bin/bash

set -e

ME=$(basename "$0")

REMOTE_NAME=${1:-origin}
BRANCH_NAME=${2:-main}
OPT_PULL=${3:-0}

usage() {
  echo "USAGE:"
  echo "  $ME [REMOTE:origin] [BRANCH:main] [pull]"
  echo
  echo "By default $ME will fetch the latest changes for every"
  echo "submodule and directly checkout the $REMOTE_NAME's $BRANCH_NAME branch."
  echo "This will leave them in detached HEAD state."
  echo "Use -p or --pull to instead forward the local $BRANCH_NAME branch."
}

set_remote() {
  git ls-remote --exit-code "$REMOTE_NAME" &>/dev/null ||
    REMOTE_NAME=origin
}

verify_branch() {
  git fetch $REMOTE_NAME
  git rev-parse --verify remotes/"$REMOTE_NAME"/"$BRANCH_NAME" &>/dev/null || BRANCH_NAME=main
}

pull_latest_commit() {
  if [ "$OPT_PULL" == "0" ]; then
    echo "git fetch $REMOTE_NAME && git switch $BRANCH_NAME ..."
    git fetch "$REMOTE_NAME" &&
    git checkout "$REMOTE_NAME/$BRANCH_NAME"
  else
    echo "git checkout $BRANCH_NAME && git pull --ff-only $REMOTE_NAME $BRANCH_NAME ..."
    git checkout "$BRANCH_NAME" &&
    git pull --ff-only "$REMOTE_NAME" "$BRANCH_NAME" || {
      echo "ERROR: make sure a local branch $BRANCH_NAME exists and can be fast-forwarded to $REMOTE_NAME"
      exit 1
    }
  fi
}

run_switch () {
    # First check for changes and stash them if wanted.
    echo "Check for changes..."
    if [[ `git status --porcelain --ignore-submodules --untracked-files=no` ]]; then
        echo "The repository $mod has changes. Stash them? [y/n]"
        read decision
        if [ $decision == "y" ]; then
            git stash
        else
            exit 0
        fi
    fi
    for mod in $(git submodule status | awk '{print $2}'); do
      (
        echo "Check for changes..."
        cd "$mod"
        if [[ `git status --porcelain` ]]; then
            echo "The repository $mod has changes. Stash them? [y/n]"
            read decision
            if [ $decision == "y" ]; then
                git stash
            else
                exit 0
            fi
        fi
      )
    done

    for mod in $(git submodule status | awk '{print $2}'); do
      (
        echo ""
        echo "$mod"
        cd "$mod"

        set_remote
        verify_branch
        pull_latest_commit
      )
    done
}

if [ $# -eq 0 ]; then 
    usage
    echo ""
    echo "Do you want to want to proceed with branch main in remote origin? [y/n]"
    read sw
    if [ $sw == "y" ]; then
        run_switch
    fi
    exit 0
fi

while getopts ":h:help:" o; do
    case "${o}" in
        h | help)
            usage
            exit 0
            ;;
        *)
            usage
            exit 0
            ;;
    esac
done
shift $((OPTIND-1))

run_switch

echo ""
echo "Successfully updated all submodules to latest commit."

