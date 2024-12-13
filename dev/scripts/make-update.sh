#!/bin/bash

set -ae

ME=$(basename "$0")

STABLE_VERSION=
STABLE_BRANCH_NAME=
STAGING_BRANCH_NAME=
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

echocmd() {
  echo "$ $@"
  $@
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

confirm_version() {
  set_remote
  STABLE_BRANCH_NAME="stable/$(awk -v FS=. -v OFS=. '{$3="x"  ; print $0}' VERSION)"  # 4.N.M -> 4.N.x
  git fetch "$REMOTE_NAME" "$STABLE_BRANCH_NAME"
  STABLE_VERSION="$(git show "$REMOTE_NAME/$STABLE_BRANCH_NAME:VERSION")"
  STAGING_VERSION="$(echo $STABLE_VERSION | awk -v FS=. -v OFS=. '{$3=$3+1 ; print $0}')"  # 4.N.M -> 4.N.M+1
  # Give the user the opportunity to adjust the calculated staging version
  read -rp "Please confirm the staging version to be used [${STAGING_VERSION}]: "
  case "$REPLY" in
    "") ;;
    *) STAGING_VERSION="$REPLY" ;;
  esac
  STAGING_BRANCH_NAME="staging/$STAGING_VERSION"
}

check_current_branch() {
  # Return 1 if remote branch does not exist
  git ls-remote --exit-code --heads "$REMOTE_NAME" "$BRANCH_NAME" &>/dev/null || {
    echo "No remote branch $REMOTE_NAME/$BRANCH_NAME found."
    return 1
  }

  # If remote branch exists ensure we are up-to-date with it
  [[ "$(git rev-parse --abbrev-ref HEAD)" == "$BRANCH_NAME" ]] || {
    echo "ERROR: $BRANCH_NAME branch not checked out ($(basename $(realpath .)))"
    ask y "Run \`git checkout $BRANCH_NAME && git submodule update --recursive\` now?" &&
      git checkout $BRANCH_NAME && git submodule update --recursive ||
      abort 0
  }

  git fetch "$REMOTE_NAME" "$BRANCH_NAME"
  if git merge-base --is-ancestor "$BRANCH_NAME" "$REMOTE_NAME/$BRANCH_NAME"; then
    echocmd git merge --ff-only "$REMOTE_NAME"/$BRANCH_NAME
  else
    ask n "$BRANCH_NAME and $REMOTE_NAME/$BRANCH_NAME have diverged. Run \`git reset --hard $REMOTE_NAME/$BRANCH_NAME\` now?" &&
      git reset --hard "$REMOTE_NAME/$BRANCH_NAME" ||
      abort 0
  fi
}

check_submodules_intialized() {
  # From `man git-submodule`:
  #   Each SHA-1 will possibly be prefixed with - if the submodule is not initialized
  git submodule status --recursive |
    awk '/^-/ {print "  " $2; x=1} END {exit x}' || {
      echo "ERROR: Found the above uninitialized submodules. Please correct before rerunning $ME."
      abort 1
    }
}

check_ssh_remotes() {
  local remote_cmd=

  [[ -z "$OPT_LOCAL" ]] ||
    return 0

  set_remote
  remote_cmd="git remote get-url --push $REMOTE_NAME"

  {
    $remote_cmd
    git submodule foreach --quiet --recursive $remote_cmd 
  } | awk '/^https?:\/\// {print "  " $1; x=1} END {exit x}' || {
    echo "WARN: The above $REMOTE_NAME remotes seem not to use ssh."
    echo "WARN: $ME will attempt to directly push to these."
    echo "WARN: Be sure your remotes are setup with proper access permissions."
    ask y "Continue?" ||
      abort 0
  }
}

pull_latest_commit() {
  if [ -z "$OPT_PULL" ]; then
    echocmd git fetch "$REMOTE_NAME" "$BRANCH_NAME" &&
    echocmd git checkout "$REMOTE_NAME/$BRANCH_NAME"
    echocmd git submodule update
  else
    echocmd git checkout "$BRANCH_NAME" &&
    echocmd git pull --ff-only "$REMOTE_NAME" "$BRANCH_NAME" || {
      echo "ERROR: make sure a local branch $BRANCH_NAME exists and can be fast-forwarded to $REMOTE_NAME"
      abort 1
    }
    echocmd git submodule update
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

push_changes() {
  [[ -z "$OPT_LOCAL" ]] ||
    return 0

  [[ "$BRANCH_NAME" == staging/* ]] || [[ "$BRANCH_NAME" == stable/* ]] || {
    echo "ERROR: Refusing to push to branch $BRANCH_NAME."
    echo "ERROR: Only staging/* or stable/* branches should be pushed to directly."
    abort 1
  }

  echo "Attempting to push $BRANCH_NAME into $REMOTE_NAME."
  echo "Ensure you have proper access rights or use --local to skip pushing."
  ask y "Continue?" ||
    abort 0
  echo ""
  echo "Submodules first ..."
  echocmd git submodule foreach --recursive git push "$REMOTE_NAME" "$BRANCH_NAME"
  echo ""
  echo "Now main repository ..."
  echocmd git push "$REMOTE_NAME" "$BRANCH_NAME"
  echo ""
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

add_changes() {
  diff_cmd="git diff --color=always --submodule=log"
  [[ "$($diff_cmd | grep -c .)" -gt 0 ]] ||
    abort 0
  echo ''
  echo "Current $BRANCH_NAME changes:"
  echo '--------------------------------------------------------------------------------'
  $diff_cmd
  echo '--------------------------------------------------------------------------------'
  ask y "Interactively choose from these?" &&
    for mod in $(git submodule status | awk '$1 ~ "^+" {print $2}'); do
      (
        set_remote
        local target_sha= mod_sha_old= mod_sha_new= log_cmd= merge_base=
        mod_sha_old="$(git diff --submodule=short "$mod" | awk '$1 ~ "^-Subproject" { print $3 }')"
        mod_sha_new="$(git diff --submodule=short "$mod" | awk '$1 ~ "^+Subproject" { print $3 }')"
        log_cmd="git -C $mod log --oneline --no-decorate $mod_sha_old..$mod_sha_new"
        target_sha="$($log_cmd | awk 'NR==1 { print $1 }' )"

        echo ""
        echo "$mod changes:"
        echo "--------------------------------------------------------------------------------"
        $log_cmd
        echo "--------------------------------------------------------------------------------"
        read -rp "Please select a commit, '-' to skip [${target_sha}]: "
        case "$REPLY" in
          "") ;;
          *) target_sha="$REPLY" ;;
        esac
        [[ "$target_sha" != '-' ]] || {
          target_sha="$(git rev-parse "HEAD:$mod")"
          echo "Selecting ${target_sha:0:7} (currently referenced from HEAD) in order to skip ..."
        }

        echocmd git -C "$mod" checkout "$target_sha"
        echocmd git -C "$mod" submodule update
        echocmd git add "$mod"
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

choose_changes() {
  ask y "Fetch all submodules $BRANCH_NAME changes now?" &&
    OPT_PULL=1 fetch_all_changes

  add_changes

  check_meta_consistency || {
    echo "WARN: openslides-meta is not consistent across services."
    echo "WARN: This means a $STAGING_BRANCH_NAME branch cannot be created in openslides-meta."
    echo "WARN: Please rectify and rerun $ME"
    abort 1
  }
}

commit_changes() {
  local commit_message="Updated services"
  [[ "$BRANCH_NAME" == main ]] &&
    commit_message="Updated services"
  [[ "$BRANCH_NAME" == staging/* ]] &&
    commit_message="Staging update $(date +%Y%m%d)"
  [[ "$BRANCH_NAME" == stable/* ]] &&
    commit_message="Update $(cat VERSION) ($(date +%Y%m%d))"
  [[ $# == 0 ]] ||
    commit_message="$@"

  ask y "Commit on branch $BRANCH_NAME now?" && {
    git commit --message "$commit_message"
    echocmd git show --no-patch
  }
}

update_main_branch() {
  ask y "Update services and create a new commit on main branch now? This should be your first step.
If it was done before, or you are certain, $STAGING_BRANCH_NAME should branch out from $REMOTE_NAME/main
as it is now, answer 'n' to create a staging branch." ||
    return 1

  BRANCH_NAME=main
  check_current_branch

  # Update VERSION
  echo "$STAGING_VERSION-dev" > VERSION
  git diff --quiet VERSION && {
    echo "ERROR: $STAGING_VERSION does not seem to differ from version number present in VERSION."
    abort 1
  }
  echocmd git add VERSION
  choose_changes
  commit_changes
  echo "Commit created. Push to a remote and PR into main repo to bring it live."
  echo "After merging, rerun $ME and start creating a staging branch."
}

initial_staging_update() {
  set_remote
  git fetch "$REMOTE_NAME" "main"

  ask y "Create new branch $BRANCH_NAME at $REMOTE_NAME/main, referenced HEADs in submodules as well as openslides-meta
to fixate changes for a new staging update now?" ||
    abort 0

  echocmd git checkout --no-track -B "$BRANCH_NAME" "$REMOTE_NAME/main"

  echo "Updating submodules and creating local $BRANCH_NAME branches"
  echocmd git submodule update --recursive
  for repo in $(git submodule status --recursive | awk '{print $2}'); do
    echocmd git -C "$repo" checkout --no-track -B "$BRANCH_NAME"
  done

  # Update VERSION
  echo "$STAGING_VERSION" > VERSION
  git diff --quiet VERSION && {
    echo "ERROR: $STAGING_VERSION does not seem to differ from version number present in VERSION."
    abort 1
  }
  echocmd git add VERSION

  commit_changes
  push_changes
}

make_staging_update() {
  local diff_cmd=

  if check_current_branch; then
    # A fitting staging/* branch exists and we can add new remote changes to
    # create a new staging update for the same version
    choose_changes
    commit_changes
    push_changes
  else
    # No fitting staging/* branch exists yet. Offer to Update main branches
    # first or create staging branches right away
    if update_main_branch; then
      return 0
    else
      initial_staging_update
    fi
  fi
}

make_hotfix_update() {
  # TODO: Reconsider the hotfix workflow
  echo "ERROR: $ME hotfix is currently not supported. Sorry ..."
  abort 1
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

  push_changes
}

merge_stable_branch() {
  local mod=
  local dir="."
  [[ $# == 0 ]] ||
    dir="$1"

  # Merge, but don't commit yet ...
  # (also we expect conflicts in submodules so we hide that output)
  git -C "$dir" merge -Xtheirs --no-commit --no-ff "$REMOTE_NAME/$STAGING_BRANCH_NAME" --log >/dev/null || :
  # ... because we want to change the submod pointers to stable
  for mod in $(git -C "$dir" submodule status | awk '{print $2}'); do
    git -C "$dir" add "$mod"
  done
}

merge_stable_branch_meta() {
  local forerunner_path=

  echo "Merging $STABLE_BRANCH_NAME in meta repositories ..."
  ask y "Continue?" ||
    abort 0

  # Doing a nested loop rather than foreach --recursive as it's easier to get
  # both the path of service submod and the (potential) meta submod in one
  # iteration
  while read mod; do
    while read meta_name meta_fullpath; do
      [[ "$meta_name" == 'openslides-meta' ]] ||
        continue

      git -C "$meta_fullpath" checkout "$BRANCH_NAME"
      if [[ -z "$forerunner_path" ]]; then
        merge_stable_branch "$meta_fullpath"
        git -C "$meta_fullpath" commit --no-edit --allow-empty \
          --message "Merge $STAGING_BRANCH_NAME into $STABLE_BRANCH_NAME. Update $(date +%Y%m%d)"
        forerunner_path="$meta_fullpath"
      else
        git -C "$meta_fullpath" pull --ff-only "$forerunner_path" "$STABLE_BRANCH_NAME"
      fi
    done <<< "$(git -C $mod submodule foreach -q 'echo "$name $toplevel/$sm_path"')"
  done <<< "$(git submodule foreach -q 'echo "$sm_path"')"
}

merge_stable_branch_services() {
  local target_sha="$1"
  local diff_cmd=
  local mod=

  echo "Merging $STABLE_BRANCH_NAME in service repositories ..."
  ask y "Continue?" ||
    abort 0

  for mod in $(git submodule status --recursive | awk '{print $2}'); do
    diff_cmd="git diff --submodule=short $BRANCH_NAME $REMOTE_NAME/$STAGING_BRANCH_NAME $mod"
    [[ "$($diff_cmd | grep -c .)" -gt 0 ]] ||
      continue

    git -C "$mod" checkout "$BRANCH_NAME"
    merge_stable_branch "$mod"
    git -C "$mod" commit --no-edit --allow-empty \
      --message "Merge $STAGING_BRANCH_NAME into $STABLE_BRANCH_NAME. Update $(date +%Y%m%d)"
  done
}

keep_stable_house() {
  ask y "Performing house keeping tasks after stable update.
- Removing local and remote $STAGING_BRANCH_NAME branches.
- Creating $STAGING_VERSION tags at tips of $STABLE_BRANCH_NAME branches.
Some of these commands may show errors as some refs are being pushed doubly.
Continue?" ||
    abort 0

  for repo in $(git submodule status --recursive | awk '{print $2}') . ; do
    echocmd git -C "$repo" branch -D "$STAGING_BRANCH_NAME" || :
    echocmd git -C "$repo" push -d "$REMOTE_NAME" "$STAGING_BRANCH_NAME" || :
    echocmd git -C "$repo" tag "$STAGING_VERSION" "$STABLE_BRANCH_NAME" || :
    echocmd git -C "$repo" push "$REMOTE_NAME" "$STAGING_VERSION" || :
  done
}

make_stable_update() {
  local log_cmd=

  set_remote
  check_current_branch

  echocmd git fetch "$REMOTE_NAME" "$STAGING_BRANCH_NAME"

  log_cmd="git log --oneline --no-decorate $STABLE_BRANCH_NAME..$REMOTE_NAME/$STAGING_BRANCH_NAME"
  [[ "$($log_cmd | grep -c . )" -gt 0 ]] || {
    echo "ERROR: No staging update ahead of the latest stable update found."
    abort 1
  }

  echo 'Staging updates since last stable update:'
  echo '--------------------------------------------------------------------------------'
  $log_cmd
  echo '--------------------------------------------------------------------------------'
  ask y "Including these staging updates for the new stable update. Continue?" ||
    abort 0

  check_meta_consistency "$REMOTE_NAME/$STAGING_BRANCH_NAME" || {
    echo "ERROR: openslides-meta is not consistent at $target_sha. This is not acceptable for a stable update."
    echo "ERROR: Please fix this in a new staging update before trying again."
    abort 1
  }

  merge_stable_branch_meta
  merge_stable_branch_services
  merge_stable_branch
  commit_changes

  check_meta_consistency || {
    echo "ERROR: Apparently merging $BRANCH_NAME went wrong and meta is not consistent anymore."
    echo "ERROR: You probably need to investigate what did go wrong."
    abort 1
  }

  push_changes
  keep_stable_house
}

staging_log() {
  git fetch -q $REMOTE_NAME $STAGING_BRANCH_NAME
  git log --graph --oneline -U0 --submodule $REMOTE_NAME/$STABLE_BRANCH_NAME..$REMOTE_NAME/$STAGING_BRANCH_NAME | \
    awk -v version="$STAGING_VERSION" '
      /^\*.*Staging update [0-9]{8}/ { printf("\n# %s-staging-%s-%s\n", version, $NF, substr($2, 0, 7)) }
      /^\*/ { printf("  %s\n",$0) }
      /^  Submodule/ {printf("    %s %s\n", $2, $3)}
      /^\| Submodule/ {printf("    %s %s\n", $3, $4)}
      /^    >/ { $1=""; printf("      %s\n", $0 )}
      /^\|   >/ { $1=""; $2=""; printf("      %s\n", $0 )}
   '
}


command -v awk > /dev/null || {
  echo "Error: 'awk' not installed!"
  exit 1
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
      check_ssh_remotes
      confirm_version
      BRANCH_NAME=$STAGING_BRANCH_NAME
      make_staging_update
      shift 1
      ;;
    stable)
      check_ssh_remotes
      confirm_version
      BRANCH_NAME=$STABLE_BRANCH_NAME
      make_stable_update
      shift 1
      ;;
    hotfix)
      confirm_version
      BRANCH_NAME=$STABLE_BRANCH_NAME
      make_hotfix_update
      shift 1
      ;;
    staging-log)
      confirm_version
      staging_log
      shift 1
      ;;
  esac
done
