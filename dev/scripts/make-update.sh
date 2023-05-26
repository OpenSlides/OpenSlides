#!/bin/bash

set -e

ME=$(basename "$0")

BRANCH_NAME=
REMOTE_NAME=
OPT_PULL=
OPT_LOCAL=

usage() {
cat <<EOF

Helper script to integrate new changes.

USAGE:
  $ME <MODE> [ --pull | -p ] [ -l | --local ]

MODES:

  fetch-all-changes
    Fetch all submodules latest upstream changes and check them out. This will
    leave them in detached HEAD state.
    Use --pull to instead forward the local branches.

  staging
    Create an update containing new changes that can be deployed for testing.
    In order to do so first fetch-all-changes is called. Then desired changes
    can be picked interactively and a new commit with appropriately adjusted
    submodule pointers is created on the main branch.

  stable
    Create an update based on a previous staging update. For this appropriate
    merge commits are created in the main repository as well as every affected
    submodule. These will then be attempted to be pushed directly into upstream.
    Use --local to skip pushing.
EOF
}

ask() {
  local default_reply="$1" reply_opt="[y/N]" blank="y" REPLY=
  shift; [[ "$default_reply" != y ]] || {
    reply_opt="[Y/n]"; blank=""
  }

  read -rp "$@ $reply_opt: "
  case "$REPLY" in
    Y|y|Yes|yes|YES|"$blank") return 0 ;;
    *) return 1 ;;
  esac
}

abort() {
  echo "Aborting."
  exit "$1"
}

set_remote() {
  REMOTE_NAME=upstream
  git ls-remote --exit-code "$REMOTE_NAME" &>/dev/null ||
    REMOTE_NAME=origin
}

check_current_branch() {
  [ "$(git rev-parse --abbrev-ref HEAD)" == "$BRANCH_NAME" ] || {
    echo "ERROR: $BRANCH_NAME branch not checked out ($(basename $(realpath .)))"
    ask y "Run \`git checkout $BRANCH_NAME\` now?" &&
      git checkout $BRANCH_NAME ||
      abort 0
  }

  git fetch "$REMOTE_NAME" "$BRANCH_NAME"
  if git merge-base --is-ancestor "$BRANCH_NAME" "$REMOTE_NAME/$BRANCH_NAME"; then
    echo "git merge --ff-only $REMOTE_NAME/$BRANCH_NAME"
    git merge --ff-only "$REMOTE_NAME"/$BRANCH_NAME
  else
    ask n "$BRANCH_NAME and $REMOTE_NAME/$BRANCH_NAME have diverged. Run \`git reset --hard $REMOTE_NAME/$BRANCH_NAME\` now?" &&
      git reset --hard "$REMOTE_NAME/$BRANCH_NAME" ||
      abort 0
  fi
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
      abort 1
    }
  fi
}

increment_patch() {
  set_remote
  patch_upstream=$(git show $REMOTE_NAME/stable:VERSION  | awk -F. '{print $3}')
  patch_local=$(git show HEAD:VERSION  | awk -F. '{print $3}')

  [[ "$patch_local" -le "$patch_upstream" ]] ||
    return 1

  echo "$(awk -v FS=. -v OFS=. "{\$3=$patch_upstream+1 ; print \$0}" VERSION)" > VERSION
}

fetch_all_changes() {
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
}


make_staging_update() {
  local REPLY= diff_cmd=

  set_remote
  check_current_branch

  ask y "Fetch all submodules changes now?" &&
    fetch_all_changes || :
  diff_cmd="git --no-pager diff --color=always --submodule=log"
  [[ "$($diff_cmd | grep -c .)" -gt 0 ]] ||
    abort 0
  echo ''
  echo 'Current changes:'
  echo '--------------------------------------------------------------------------------'
  $diff_cmd
  echo '--------------------------------------------------------------------------------'
  ask y "Interactively add these for the update?" &&
    for mod in $(git submodule status | awk '$1 ~ "^+" {print $2}'); do
      (
        set_remote
        local target_sha= mod_sha_old= mod_sha_new= log_cmd=
        mod_sha_old="$(git diff --submodule=short "$mod" | awk '$1 ~ "^-Subproject" { print $3 }')"
        mod_sha_new="$(git diff --submodule=short "$mod" | awk '$1 ~ "^+Subproject" { print $3 }')"
        log_cmd="git -C $mod log --oneline --no-decorate $mod_sha_old..$mod_sha_new"
        target_sha="$($log_cmd | awk 'NR==1 { print $1 }' )"

        echo ""
        echo "$mod changes:"
        echo "--------------------------------------------------------------------------------"
        $log_cmd
        echo "--------------------------------------------------------------------------------"
        read -rp "Please confirm the latest change to be included, '-' to skip [${target_sha}]: "
        case "$REPLY" in
          "") ;;
          *) target_sha="$REPLY" ;;
        esac
        [[ "$target_sha" != '-' ]] ||
          exit 0 # exit the subshell, acting like 'continue'
        git -C "$mod" checkout "$target_sha"
        git add "$mod"
      )
    done || :

  echo ''
  diff_cmd="git --no-pager diff --staged --submodule=log"
  [[ "$($diff_cmd | grep -c .)" -gt 0 ]] || {
    echo "No changes added."
    abort 0
  }
  echo 'Changes to be included for the new staging update:'
  echo '--------------------------------------------------------------------------------'
  $diff_cmd
  echo '--------------------------------------------------------------------------------'
  ask y "Commit now?" && {
    increment_patch &&
      git add VERSION
    git commit --message "Staging update $(date +%Y%m%d)"
    git show --no-patch
    echo "Commit created. Push to $REMOTE_NAME remote and PR into main repo to bring it live."
  } || :
}

merge_stable_branches() {
  local target_sha="$1"
  local mod_target_sha=
  local diff_cmd=

  echo "Creating merge commits in submodules..."
  ask y "Continue?" ||
    abort 0

  for mod in $(git submodule status | awk '{print $2}'); do
    diff_cmd="git diff --submodule=short $BRANCH_NAME $target_sha $mod"
    [[ "$($diff_cmd | grep -c .)" -gt 0 ]] ||
      continue

    mod_target_sha="$($diff_cmd | awk '$1 ~ "^+Subproject" { print $3 }')"
    (
      echo ""
      echo "$mod"
      cd "$mod"

      set_remote
      git checkout "$BRANCH_NAME"

      git merge --no-ff "$mod_target_sha" --log --message "Merge main into stable. Update $(date +%Y%m%d)"
    )
  done

  echo ""
  echo "Updated submodules $BRANCH_NAME branches."
}

make_stable_update() {
  local target_sha= log_cmd= REPLY=

  set_remote
  check_current_branch

  echo "git fetch $REMOTE_NAME main"
  git fetch $REMOTE_NAME main

  log_cmd="git log --oneline --no-decorate stable..$REMOTE_NAME/main"
  [[ "$($log_cmd | grep -c . )" -gt 0 ]] || {
    echo "ERROR: No staging update ahead of the latest stable update found."
    abort 1
  }
  target_sha="$($log_cmd | awk 'NR==1 { print $1 }')"

  echo 'Staging updates since last stable update:'
  echo '--------------------------------------------------------------------------------'
  $log_cmd
  echo '--------------------------------------------------------------------------------'
  read -rp "Please confirm the staging update to base this stable update on [${target_sha}]: "
  case "$REPLY" in
    "") ;;
    *) target_sha="$REPLY" ;;
  esac

  merge_stable_branches "$target_sha"

  # Merge, but don't commit yet ...
  # (also we expect conflicts in submodules so we hide that output)
  git merge --no-commit --no-ff "$target_sha" --log >/dev/null || :
  # ... because we want to change the submod pointers to stable
  for mod in $(git submodule status | awk '{print $2}'); do
    git add "$mod"
  done
  # Now commit the merge with corrected submodule pointers
  git commit --message "Update $(cat VERSION) ($(date +%Y%m%d))"

  [[ -z "$OPT_LOCAL" ]] ||
    return 0

  echo "Attempting to push new $BRANCH_NAME commits into $REMOTE_NAME."
  echo "Ensure you have proper access rights or use --local to skip pushing."
  ask y "Continue?" ||
    abort 0
  echo "Submodules first ..."
  git submodule foreach git push "$REMOTE_NAME" "$BRANCH_NAME"
  echo "Now main repository ..."
  git push "$REMOTE_NAME" "$BRANCH_NAME"
}

shortopt='phl'
longopt='pull,help,local'
ARGS=$(getopt -o "$shortopt" -l "$longopt" -n "$ME" -- $@)
# reset $@ to args array sorted and validated by getopt
eval set -- "$ARGS"
unset ARGS


while true; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    -p | --pull)
      OPT_PULL=1
      shift
      ;;
    -l | --local)
      OPT_LOCAL=1
      shift
      ;;
    --) shift ; break ;;
    *) usage; exit 1 ;;
  esac
done

for arg; do
  case $arg in
    fetch-all-changes)
      BRANCH_NAME=main
      fetch_all_changes
      shift 1
      ;;
    staging)
      BRANCH_NAME=main
      make_staging_update
      shift 1
      ;;
    stable)
      BRANCH_NAME=stable
      make_stable_update
      shift 1
      ;;
  esac
done
