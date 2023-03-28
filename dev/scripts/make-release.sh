#!/bin/bash

set -e

ME=$(basename "$0")

BRANCH_NAME=staging
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

check_current_branch() {
  [ "$(git rev-parse --abbrev-ref HEAD)" == "$BRANCH_NAME" ] || {
    echo "ERROR: $BRANCH_NAME branch not checked out ($(basename $(realpath .)))"
    exit 1
  }
}

check_ancestry() {
  if ! git merge-base main --is-ancestor staging ; then
    echo "ERROR: main must be an ancestor of staging. ($(basename $(realpath .)))"
    exit 1
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
      exit 1
    }
  fi
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


make_staging_release() {
  local REPLY

  check_current_branch

  # Make sure there are changes
  while [ "$(git diff --staged --name-only | wc -l)" -eq 0 ] ; do
    echo 'There appear to be no staged changes.'
    if [ "$(git diff --name-only | wc -l)" -eq 0 ] ; then
      echo 'There also appear to be no unstaged changes.'
      read -rp 'Fetch all upstream staging changes now? [Y/n]: '
      case "$REPLY" in
        Y|y|Yes|yes|YES|"")
          fetch_all_changes
          ;;
        *)
          echo "Please use \`git add\` to manually add changes for the release and rerun $ME"
          exit 0
          ;;
      esac
    fi
    if [ "$(git diff --name-only | wc -l)" -ne 0 ] ; then
      echo 'Currently unstaged changes'
      echo '--------------------------------------------------------------------------------'
      git diff --submodule=log
      echo '--------------------------------------------------------------------------------'
      read -rp "Interactively add these for the release? [Y/n]: "
      case "$REPLY" in
        Y|y|Yes|yes|YES|"")
          git add -p
          ;;
      esac
    else
      echo 'No changes available for new release. Aborting...'
      exit 0
    fi
  done

  echo 'Currently staged changes:'
  echo '--------------------------------------------------------------------------------'
  git diff --staged --submodule=log
  echo '--------------------------------------------------------------------------------'
  read -rp "Include these changes for a new staging release? [Y/n]: "
  case "$REPLY" in
    Y|y|Yes|yes|YES|"")
      git commit --message "Staging release $(date +%Y%m%d)"
      git show --no-patch
      echo "Commit created. Push to desired remote and PR into main repo to bring it live."
      ;;
  esac
}

make_main_release() {
  local target_sha= log_main_staging=

  check_current_branch
  #check_ancestry
  for mod in $(git submodule status | awk '{print $2}'); do
    (
      cd "$mod"
      check_current_branch
      #check_ancestry
    )
  done


  log_main_staging="$(git log --oneline main..staging)"
  [[ "$(grep -c . <<< "$log_main_staging")" -gt 0 ]] || {
    echo "ERROR: No staging releases ahead of the latest main release found."
    exit 1
  }
  target_sha="$(awk 'NR==1 { print $1 }' <<< "$log_main_staging")"

  echo 'Staging releases since last main release:'
  echo '--------------------------------------------------------------------------------'
  echo "$log_main_staging"
  echo '--------------------------------------------------------------------------------'
  read -rp "Please confirm the staging release to base this main release on [${target_sha::7}]: "
  case "$REPLY" in
    "")
      ;;
    *)
      target_sha="$REPLY"
      ;;
  esac

  for mod in $(git submodule status | awk '{print $2}'); do
    (
      local submodule_target_sha= diff=
      #diff="$(git show "$target_sha" -p "$mod")"
      diff="$(git diff "HEAD..$target_sha" -p "$mod")"
      [[ "$(grep -c . <<< "$diff")" -gt 0 ]] ||
        exit 0 # this is a subshell, so this more of a 'continue'
      submodule_target_sha="$(awk '$1 ~ "^+Subproject" { print $3 }' <<< "$diff")"
      echo "$mod: $submodule_target_sha"
      cd "$mod"
      git merge --no-ff "$submodule_target_sha" --log --message "Release $(date +%Y%m%d)"
    )
  done
  git merge --no-ff "$target_sha" --log --message "Release $(date +%Y%m%d)"
}

shortopt='ph'
longopt='pull,help'
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
    --) shift ; break ;;
    *) usage; exit 1 ;;
  esac
done

for arg; do
  case $arg in
    fetch-all-changes)
      fetch_all_changes
      shift 1
      ;;
    staging)
      make_staging_release
      shift 1
      ;;
    main)
      BRANCH_NAME=main
      make_main_release
      shift 1
      ;;
  esac
done
