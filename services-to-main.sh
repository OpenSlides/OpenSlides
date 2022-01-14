# !/bin/bash

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
   local SUBMODULE_NAME=$0
   echo ""
   echo "$SUBMODULE_NAME"

   local BRANCH_NAME=$(get_upstream_branch)
   local REMOTE_NAME=$(get_upstream_name)

   echo "git fetch $REMOTE_NAME && git checkout $REMOTE_NAME/$BRANCH_NAME ..."
   git fetch $REMOTE_NAME;
   git checkout $REMOTE_NAME/$BRANCH_NAME;
}

export -f pull_latest_commit
export -f get_upstream_branch
export -f get_upstream_name

git submodule foreach -q --recursive "bash -c pull_latest_commit \$name"

echo ""
echo "Successfully updated all submodules to latest commit."

