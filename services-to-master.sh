# !/bin/bash

function get_upstream_branch {
   local SUBMODULE_NAME=$0
   local MEDIA_SERVICE_NAME="openslides-media-service"
   # We have to treat the media-service differently to the other services 
   # until its "main" branch is neither master nor main
   if [ "$SUBMODULE_NAME" == "$MEDIA_SERVICE_NAME" ]; then
      echo "openslides4-dev"
      return
   fi;

   local BRANCH_NAME=master
   local exists=`git show-ref refs/heads/$BRANCH_NAME`
   if [[ -z $exists ]]; then
      BRANCH_NAME=main
   fi;
   echo "$BRANCH_NAME"
}

function get_upstream_name {
   { 
      # try
      git ls-remote --exit-code upstream 2>/dev/null && echo "upstream"
   } || {
      # catch
      echo "origin"
   }
}

function pull_latest_commit {
   local SUBMODULE_NAME=$0
   echo "Pulling latest commit for: $SUBMODULE_NAME"
   echo "$SUBMODULE_NAME: Checking which branch is the upstream branch"

   local BRANCH_NAME=$(get_upstream_branch)

   echo "$SUBMODULE_NAME: Upstream branch is $BRANCH_NAME"

   git checkout $BRANCH_NAME;

   local REMOTE_NAME=$(get_upstream_name)
   git pull $REMOTE_NAME $BRANCH_NAME;

   echo "$SUBMODULE_NAME: Successfully pulled latest commit"
}

export -f pull_latest_commit
export -f get_upstream_branch
export -f get_upstream_name

git submodule update --init
git submodule foreach -q --recursive "bash -c pull_latest_commit \$name"

echo "Successfully pulled latest commits for every submodule!"

# Old command, if we need to checkout another branch than master or main:
# git submodule foreach -q --recursive
# '
# git checkout $(git config -f $$toplevel/.gitmodules submodule.$$name.branch || echo master); 
# git pull upstream $$(git config -f $$toplevel/.gitmodules submodule.$$name.branch || echo master)
# '