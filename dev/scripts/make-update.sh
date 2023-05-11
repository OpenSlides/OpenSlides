#!/bin/bash

set -e

ME=$(basename "$0")

BRANCH_NAME=
REMOTE_NAME=
OPT_PULL=
OPT_LOCAL_COMMIT=

usage() {
cat <<EOF
USAGE:
  $ME <MODE> [ --pull | -p ] [ -l | --local ]

Helper script to integrate new changes.

  MODES:

  fetch-all-changes
    Fetch all submodules latest upstream changes and check them out. This will
    leave them in detached HEAD state. Use --pull to instead forward the local
    branches.

  staging 
    Create an update containing new changes that can be deployed for testing.
    In order to do so first fetch-all-changes is called. Then desired changes
    can be picked interactively and a new commit with appropriately adjusted
    submodule pointers is created on the staging branch.

  main
    Create an update based on a previous staging update. For this appropriate
    merge commits are created in the main repository as well as every affected
    submodule. These will then be attempted to be pushed directly into upstream.
    Use --local to skip pushing.
EOF
}

set_remote() {
  REMOTE_NAME=upstream
  git ls-remote --exit-code "$REMOTE_NAME" &>/dev/null ||
    REMOTE_NAME=origin
}

check_current_branch() {
  [ "$(git rev-parse --abbrev-ref HEAD)" == "$BRANCH_NAME" ] || {
    echo "ERROR: $BRANCH_NAME branch not checked out ($(basename $(realpath .)))"
    read -rp "Run \`git checkout $BRANCH_NAME\` now? [Y/n]: "
    case "$REPLY" in
      Y|y|Yes|yes|YES|"") git checkout $BRANCH_NAME ;;
      *) echo "Aborting."; exit 0 ;;
    esac
  }

  git fetch "$REMOTE_NAME" "$BRANCH_NAME"
  if git merge-base --is-ancestor "$BRANCH_NAME" "$REMOTE_NAME/$BRANCH_NAME"; then
    echo "git merge --ff-only $REMOTE_NAME/$BRANCH_NAME"
    git merge --ff-only "$REMOTE_NAME"/$BRANCH_NAME
  else
    read -rp "$BRANCH_NAME and $REMOTE_NAME/$BRANCH_NAME have diverged. Run \`git reset --hard $REMOTE_NAME/$BRANCH_NAME\` now? [y/N]: "
    case "$REPLY" in
      Y|y|Yes|yes|YES)
          git reset --hard "$REMOTE_NAME/$BRANCH_NAME"
        ;;
      *)
        echo "Aborting."
        exit 0
    esac
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

increment_patch() {
  set_remote
  patch_main=$(git show $REMOTE_NAME/main:VERSION  | awk -F. '{print $3}')
  patch_local=$(git show HEAD:VERSION  | awk -F. '{print $3}')

  [[ "$patch_local" -le "$patch_main" ]] ||
    return 1

  echo "$(awk -v FS=. -v OFS=. "{\$3=$patch_main+1 ; print \$0}" VERSION)" > VERSION
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

  read -rp 'Fetch all services staging changes now? [Y/n]: '
  case "$REPLY" in
    Y|y|Yes|yes|YES|"")
      fetch_all_changes
      ;;
    *)
  esac
  diff_cmd="git --no-pager diff --color=always --submodule=log"
  [[ "$($diff_cmd | grep -c .)" -gt 0 ]] || {
    echo "No changes. Aborting"
    exit 0
  }
  echo ''
  echo 'Current changes:'
  echo '--------------------------------------------------------------------------------'
  $diff_cmd
  echo '--------------------------------------------------------------------------------'
  read -rp "Interactively add these for the update? [Y/n]: "
  case "$REPLY" in
    Y|y|Yes|yes|YES|"")
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
      done
      ;;
  esac

  echo ''
  diff_cmd="git --no-pager diff --staged --submodule=log"
  [[ "$($diff_cmd | grep -c .)" -gt 0 ]] || {
    echo "No changes added. Aborting"
    exit 0
  }
  echo 'Changes to be included for the new staging update:'
  echo '--------------------------------------------------------------------------------'
  $diff_cmd
  echo '--------------------------------------------------------------------------------'
  read -rp "Commit now? [Y/n]: "
  case "$REPLY" in
    Y|y|Yes|yes|YES|"")
      increment_patch &&
        git add VERSION
      git commit --message "Staging update $(date +%Y%m%d)"
      git show --no-patch
      echo "Commit created. Push to desired remote and PR into main repo to bring it live."
      ;;
  esac
}

update_main_branches() {
  local target_sha="$1"
  local mod_target_sha=
  local diff_cmd=

  echo -n "Creating merge commits in submodules"
  [[ -n "$OPT_LOCAL_COMMIT" ]] || {
    echo " and attempting to push into $REMOTE_NAME."
    echo -n "Ensure you have proper access rights or use --local to skip pushing"
  }
  echo "."
  read -rp "Continue? [Y/n]: "
  case "$REPLY" in
    Y|y|Yes|yes|YES|"") ;;
    *)
      echo "Aborting."
      exit 0
  esac

  for mod in $(git submodule status | awk '{print $2}'); do
  #while read -r x mod y; do
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

      git merge --no-ff "$mod_target_sha" --log --message "Merge staging into main. Update $(date +%Y%m%d)"
      [[ -n "$OPT_LOCAL_COMMIT" ]] || {
        git push "$REMOTE_NAME" "$BRANCH_NAME"
      }
    )
  done
  #done < <(git submodule status)

  echo ""
  echo "Updated submodules $BRANCH_NAME branches."
}

make_main_update() {
  local target_sha= log_cmd= REPLY=

  set_remote
  check_current_branch

  echo "git fetch $REMOTE_NAME staging"
  git fetch $REMOTE_NAME staging

  log_cmd="git log --oneline --no-decorate main..$REMOTE_NAME/staging"
  [[ "$($log_cmd | grep -c . )" -gt 0 ]] || {
    echo "ERROR: No staging update ahead of the latest main update found."
    exit 1
  }
  target_sha="$($log_cmd | awk 'NR==1 { print $1 }')"

  echo 'Staging updates since last main update:'
  echo '--------------------------------------------------------------------------------'
  $log_cmd
  echo '--------------------------------------------------------------------------------'
  read -rp "Please confirm the staging update to base this main update on [${target_sha}]: "
  case "$REPLY" in
    "") ;;
    *) target_sha="$REPLY" ;;
  esac

  update_main_branches "$target_sha"

  # Merge, but don't commit yet ...               
  # (also we expect conflicts in submodules so we hide that output)
  git merge --no-commit --no-ff "$target_sha" --log >/dev/null || :
  # ... because we want to change the submod pointers to main
  for mod in $(git submodule status | awk '{print $2}'); do
    git add "$mod"
  done
  # Now commit the merge with corrected submodule pointers
  git commit --message "Update $(date +%Y%m%d)"
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
    -l | --local
      OPT_LOCAL_COMMIT=1
      shift
      ;;
    --) shift ; break ;;
    *) usage; exit 1 ;;
  esac
done

for arg; do
  case $arg in
    fetch-all-changes)
      BRANCH_NAME=staging
      fetch_all_changes
      shift 1
      ;;
    staging)
      BRANCH_NAME=staging
      make_staging_update
      shift 1
      ;;
    main)
      BRANCH_NAME=main
      make_main_update
      shift 1
      ;;
  esac
done
