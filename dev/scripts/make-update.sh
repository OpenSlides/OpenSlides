#!/bin/bash

set -ae

ME=$(basename "$0")

STABLE_BRANCH_NAME="stable/$(awk -v FS=. -v OFS=. '{$3="x" ; print $0}' VERSION)"
BRANCH_NAME=
REMOTE_NAME=
OPT_PULL=
OPT_LOCAL=

# do not page diff and log outputs
GIT_PAGER=

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

  hotfix
    Create an update based on changes in submodules stable branches. Will
    create a new commit in the main repositories stable analogous to the stable
    workflow. These will then be attempted to be pushed directly into upstream.
    Use --local to skip pushing.
    Changes must manually be reflected into the main branch afterwards.
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
    ask y "Run \`git checkout --recurse-submodules $BRANCH_NAME\` now?" &&
      git checkout --recurse-submodules $BRANCH_NAME ||
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

check_submodules_intialized() {
  # From `man git-submodule`:
  #   Each SHA-1 will possibly be prefixed with - if the submodule is not initialized
  git submodule status --recursive | awk '$1 ~ "^-" {print "  " $2; x=1} END {exit x}' || {
    echo "ERROR: Found the above uninitialized submodules. Please correct before rerunning $ME."
    abort 1
  }
}

check_meta_consistency() {
  local target_rev="$1"
  local meta_sha=
  local meta_sha_last=
  local ret_code=0

  echo "Checking openslides-meta consistency ..."

  # Doing a nested loop rather than foreach --recursive as it's easier to get
  # both the path of service submod and the (potential) meta submod in one
  # iteration
  while read mod; do
    while read meta_name meta_path; do
      [[ "$meta_name" == 'openslides-meta' ]] ||
        continue

      # If target_rev is not specified we check the status of the currently
      # checked out HEAD in the service submod.
      # Note that this is different from target_rev being specified as 'HEAD'
      # as the service submod can be in a different state than recorded in HEAD
      # (e.g. changed commit pointer during staging-update)
      mod_target_rev=HEAD
      [[ "$target_rev" == "" ]] ||
        mod_target_rev="$(git rev-parse "${target_rev}:${mod}")"

      meta_sha="$(git -C "$mod" rev-parse "${mod_target_rev}:${meta_path}")"
      echo "  $meta_sha $mod"
      [[ -z "$meta_sha_last" ]] || [[ "$meta_sha" == "$meta_sha_last" ]] ||
        ret_code=1
      meta_sha_last="$meta_sha"
    done <<< "$(git -C $mod submodule foreach -q 'echo "$name $sm_path"')"
  done <<< "$(git submodule foreach -q 'echo "$sm_path"')"

  return $ret_code
}

pull_latest_commit() {
  if [ -z "$OPT_PULL" ]; then
    echo "git fetch $REMOTE_NAME && git checkout --recurse-submodules $REMOTE_NAME/$BRANCH_NAME ..."
    git fetch "$REMOTE_NAME" &&
    git checkout --recurse-submodules "$REMOTE_NAME/$BRANCH_NAME"
  else
    echo "git checkout --recurse-submodules $BRANCH_NAME && git pull --ff-only $REMOTE_NAME $BRANCH_NAME ..."
    git checkout --recurse-submodules "$BRANCH_NAME" &&
    git pull --ff-only "$REMOTE_NAME" "$BRANCH_NAME" || {
      echo "ERROR: make sure a local branch $BRANCH_NAME exists and can be fast-forwarded to $REMOTE_NAME"
      abort 1
    }
  fi
}

increment_patch() {
  set_remote
  patch_upstream=$(git show $REMOTE_NAME/$STABLE_BRANCH_NAME:VERSION  | awk -F. '{print $3}')
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

add_changes() {
  local REPLY= diff_cmd=

  set_remote
  check_current_branch

  ask y "Fetch all submodules changes now?" &&
    fetch_all_changes
  diff_cmd="git diff --color=always --submodule=log"
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
        [[ "$target_sha" != '-' ]] || {
          #exit 0 # exit the subshell, acting like 'continue'
          target_sha="$(git rev-parse "HEAD:$mod")"
        }
        git -C "$mod" checkout --recurse-submodules "$target_sha"
        git add "$mod"
      )
    done

  echo ''
  diff_cmd="git diff --staged --submodule=log"
  [[ "$($diff_cmd | grep -c .)" -gt 0 ]] || {
    echo "No changes added."
    abort 0
  }
  echo 'Changes to be included for the new update:'
  echo '--------------------------------------------------------------------------------'
  $diff_cmd
  echo '--------------------------------------------------------------------------------'
}

make_staging_update() {
  local diff_cmd=

  add_changes

  check_meta_consistency || {
    echo "WARN: openslides-meta is not consistent. Continuing may imply services are incompatible."
    echo "WARN: Be sure to fix this until the next stable update."
    ask y "Continue?" ||
      abort 1
  }

  ask y "Commit on branch $BRANCH_NAME for a new staging update now?" && {
    increment_patch &&
      git add VERSION
    git commit --message "Staging update $(date +%Y%m%d)"
    git show --no-patch
    echo "Commit created. Push to $REMOTE_NAME remote and PR into main repo to bring it live."
  }
}

make_hotfix_update() {
  local diff_cmd=

  add_changes

  check_meta_consistency || {
    echo "WARN: openslides-meta is not consistent. This is not a good sign for stable update."
    echo "WARN: Only continue if you are sure services will be compatible."
    ask n "Continue?" ||
      abort 1
  }

  ask y "Commit on branch $BRANCH_NAME for a new stable (hotfix) update now?" && {
    increment_patch &&
      git add VERSION
    git commit --message "Update $(cat VERSION) ($(date +%Y%m%d))"
    git show --no-patch
    echo "Commit created."
  }

  [[ -z "$OPT_LOCAL" ]] ||
    return 0

  echo "Attempting to push new $BRANCH_NAME commit into $REMOTE_NAME."
  echo "Ensure you have proper access rights or use --local to skip pushing."
  ask y "Continue?" ||
    abort 0
  git push "$REMOTE_NAME" "$BRANCH_NAME"
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
      git checkout --recurse-submodules "$BRANCH_NAME"
      check_current_branch

      git merge --no-ff -Xtheirs "$mod_target_sha" --log --message "Merge main into $STABLE_BRANCH_NAME. Update $(date +%Y%m%d)"
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

  log_cmd="git log --oneline --no-decorate $STABLE_BRANCH_NAME..$REMOTE_NAME/main"
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

  check_meta_consistency "$target_sha" || {
    echo "ERROR: openslides-meta is not consistent at $target_sha. This is not acceptable for a stable update."
    echo "ERROR: Please fix this in a new staging update before trying again."
    abort 1
  }

  merge_stable_branches "$target_sha"

  # Merge, but don't commit yet ...
  # (also we expect conflicts in submodules so we hide that output)
  git merge -Xtheirs --no-commit --no-ff "$target_sha" --log >/dev/null || :
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

# $ME assumes all submodules to be initialized, so check before doing anything else
check_submodules_intialized

for arg; do
  case $arg in
    fetch-all-changes)
      BRANCH_NAME=main
      fetch_all_changes
      check_meta_consistency ||
        echo "WARN: openslides-meta is not consistent."
      shift 1
      ;;
    staging)
      BRANCH_NAME=main
      make_staging_update
      shift 1
      ;;
    stable)
      BRANCH_NAME=$STABLE_BRANCH_NAME
      make_stable_update
      shift 1
      ;;
    hotfix)
      BRANCH_NAME=$STABLE_BRANCH_NAME
      make_hotfix_update
      shift 1
      ;;
  esac
done
