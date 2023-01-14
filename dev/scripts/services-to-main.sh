#!/bin/bash

set -e

ME=$(basename "$0")

BRANCH_NAME=main
REMOTE_NAME=
OPT_PULL=

usage() {
  echo "USAGE:"
  echo "  $ME [ --pull | -p ]"
  echo
  echo "By default $ME will fetch the latest upstream changes for every"
  echo "service/submodule and directly checkout the upstream's $BRANCH_NAME branch."
  echo "This will leave them in detached HEAD state."
  echo "Use --pull to instead forward the local $BRANCH_NAME branch."
}

set_remote() {
  REMOTE_NAME=upstream
  git ls-remote --exit-code "$REMOTE_NAME" &>/dev/null ||
    REMOTE_NAME=origin
}

pull_latest_commit() {
  if [ -z "$OPT_PULL" ]; then
    echo "git fetch $REMOTE_NAME && git checkout $REMOTE_NAME/$BRANCH_NAME ..."
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

while [ "$#" -gt 0 ]; do
  case "$1" in
    -p | --pull)
      OPT_PULL=1
      shift
      ;;
    *)
      usage
      exit 0
      ;;
  esac
done

for mod in $(git submodule status | awk '{print $2}'); do
  (
    echo ""
    echo "$mod"
    cd "$mod"

    set_remote
    pull_latest_commit
  )
done

echo ""
echo "Successfully updated all submodules to latest commit."

