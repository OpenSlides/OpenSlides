#!/bin/bash

set -e

function get_upstream_branch {
   local BRANCH_NAME=main
   local exists=`git show-ref refs/heads/$BRANCH_NAME`
   if [[ -z $exists ]]; then
      BRANCH_NAME=main
   fi;
   echo "$BRANCH_NAME"
}

function get_upstream_name {
   git ls-remote --exit-code upstream &>/dev/null || {
      echo "origin"
      return
   }
   echo "upstream"
}

function pull_latest_commit {
   local BRANCH_NAME=$(get_upstream_branch)
   local REMOTE_NAME=$(get_upstream_name)

   echo "git fetch $REMOTE_NAME && git checkout $REMOTE_NAME/$BRANCH_NAME ..."
   git fetch $REMOTE_NAME;
   git checkout $REMOTE_NAME/$BRANCH_NAME;
}

export -f pull_latest_commit
export -f get_upstream_branch
export -f get_upstream_name

for mod in $(git submodule status | awk '{print $2}'); do
  (
    echo ""
    echo "$mod"
    cd "$mod"
    pull_latest_commit "$mod"
  )
done

echo ""
echo "Successfully updated all submodules to latest commit."

