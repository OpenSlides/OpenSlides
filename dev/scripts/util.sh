#!/bin/bash

# Commonly used bash functions to help with interaction and visuals

# Colors for echocmd, info, warn and error
# This if construct basically hardcodes a --color=auto option.
# At some point we might want to add a configurable --color option.
if [[ -t 1 ]]; then
  COL_NORMAL="$(tput sgr0)"
  COL_GRAY="$(tput bold; tput setaf 0)"
  COL_RED="$(tput setaf 1)"
  COL_GREEN="$(tput setaf 2)"
  COL_YELLOW="$(tput setaf 3)"
  COL_BLUE="$(tput setaf 4)"
  COL_CYAN="$(tput setaf 6)"
else
  COL_NORMAL=""
  COL_GRAY=""
  COL_RED=""
  COL_YELLOW=""
  COL_BLUE=""
  COL_GREEN=""
  COL_CYAN=""
fi

ask() {
  # n - Set 'n' as default answer. Default is 'y'
  # o - Echo output instead. Default is returning output as exit code
  if [ "$#" -eq 1 ]; then error "ask requires two parameters" && exit 1; fi

  local CONTROL_STR="$1" DEFAULT_REPLY="0" REPLY_OPT="[Y/n]" REPLY= OUTPUT=

  # Read control string
  case "$CONTROL_STR" in
    *n*) DEFAULT_REPLY="1" && \
         REPLY_OPT="[y/N]" ;;
    *o*) local OPT_ECHO=1 ;;
  esac

  shift 1
  local QUERY="$*"

  read -rp $'\n'"$QUERY $REPLY_OPT: "
  case "$REPLY" in
    Y|y|Yes|yes|YES) OUTPUT=0;;
    "") OUTPUT="$DEFAULT_REPLY" ;;
    *) OUTPUT=1 ;;
  esac

  if [ -n "$OPT_ECHO" ]
  then
    echo "$OUTPUT"
  else
    return "$OUTPUT"
  fi
}

input(){
  read -rp $'\n'"$* $REPLY_OPT: "
  case "$REPLY" in
    "") shift ;;
    *) echo "$REPLY" ;;
  esac
}

set_remote() {
  local DEFAULT_NAME=${1:-upstream}
  local OPTION=${2:-origin}
  if git ls-remote --exit-code "$DEFAULT_NAME" &>/dev/null
  then
    echo "$DEFAULT_NAME"
  else
    echo "$OPTION"
  fi
}

# echocmd first echos args in blue on stderr. Then args are treated like a
# provided command and executed.
# This allows callers of echocmd to still handle their provided command's stdout
# as if executed directly.
echocmd() {
  (
  IFS=$' '
  echo "${COL_BLUE}$ $*${COL_NORMAL}" >&2
  if [ -n "$DEBUG_DRY_RUN" ]; then return 0; fi
  $*
  return $?
  )
}

info() {
  echo "${COL_GRAY}$*${COL_NORMAL}"
}

warn() {
  echo "${COL_YELLOW}[WARN] ${COL_GRAY}$*${COL_NORMAL}" >&2
}

error() {
  echo "${COL_RED}[ERROR] ${COL_GRAY}$*${COL_NORMAL}" >&2
}

abort() {
  echo "Aborting."
  exit "$1"
}

success() {
    echo "${COL_GREEN}$*${COL_NORMAL}"
}


submodule_do_inner_func() {
  (
      # Go repository
      if [[ "$sm_path" == 'lib/openslides-go' ]] && [[ -z "$OPT_GO" ]]
      then
        exit 0
      fi

      # Meta repository
      if [[ "$sm_path" == 'meta' ]] && [[ -z "$OPT_META" ]]
      then
        exit 0
      fi

      echo ""
      info "Command started: ${sm_path}: ${COMMAND}"

      cd "${toplevel}/${sm_path}" || exit 1
      echocmd eval "$COMMAND"
    )
}

submodules_do() {
  # p - Activates parallel execution. Default is linear
  # m - Take meta repository into account. Per default meta will be ignored
  # g - Take go repository into account. Per default go will be ignored

  if [ "$#" -eq 1 ]; then error "submodules_do requires two parameters" && exit 1; fi

  local CONTROL_STR="$1"

   # Read control string
  case "$CONTROL_STR" in
    *p*) local OPT_PARALLEL="&" ;;
    *m*) local OPT_META="1" ;;
    *g*) local OPT_GO="1" ;;
  esac

  shift 1
  COMMAND="$*"

  while read -r toplevel sm_path; do
    if [ -z "$OPT_PARALLEL" ]
    then
      submodule_do_inner_func
    else
      submodule_do_inner_func &
    fi
  done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path"')"
  wait
}

check_submodules_intialized() {
  # From `man git-submodule`:
  #   Each SHA-1 will possibly be prefixed with - if the submodule is not initialized
  git submodule status --recursive |
    awk '/^-/ {print "  " $2; x=1} END {exit x}' || {
      error "Found the above uninitialized submodules. Please correct before rerunning $(basename "$0")."
      abort 1
    }
}

check_meta_consistency() {
  local target_rev="$1"
  local target_rev_at_str=
  local mod_target_rev=
  local meta_sha=
  local meta_sha_last=
  local ret_code=0

  [[ -n "$target_rev" ]] &&
    target_rev_at_str="(at $target_rev) "
  info "Checking openslides-meta consistency $target_rev_at_str..."

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

      meta_sha="$(git -C "$mod" rev-parse "${mod_target_rev}:${meta_path}" | cut -c1-7)"
      echo "  $meta_sha $mod"
      [[ -z "$meta_sha_last" ]] || [[ "$meta_sha" == "$meta_sha_last" ]] ||
        ret_code=1
      meta_sha_last="$meta_sha"
    done <<< "$(git -C $mod submodule foreach -q 'echo "$name $sm_path"')"
  done <<< "$(git submodule foreach -q 'echo "$sm_path"')"

  return $ret_code
}

check_go_consistency() {
  local target_rev="$1"
  local target_rev_at_str=
  local mod_target_rev=
  local osgo_version=
  local osgo_version_last=
  local ret_code=0

  [[ -n "$target_rev" ]] &&
    target_rev_at_str="(at $target_rev) "
  info "Checking openslides-go consistency $target_rev_at_str..."

  while read mod_name mod_path; do
    grep -q openslides-go "$mod_path/go.mod" 2>/dev/null ||
      continue

    # In the repo itself use sha of $mod_target_rev rather than from go.mod file.
    if [[ "$mod_name" == 'openslides-go' ]]; then
      mod_target_rev="${target_rev:-HEAD}"
      osgo_version="$(git -C "$mod_path" rev-parse "$mod_target_rev" |cut -c1-7)"
      echo "  $osgo_version $mod_name (HEAD)"
    else
      # If target_rev is not specified we check the status of the currently
      # checked out HEAD in the service submod.
      # Note that this is different from target_rev being specified as 'HEAD'
      # as the service submod can be in a different state than recorded in HEAD
      # (e.g. changed commit pointer during staging-update)
      mod_target_rev=HEAD
      [[ "$target_rev" == "" ]] ||
        mod_target_rev="$(git rev-parse "${target_rev}:${mod_path}")"

      osgo_version="$(git -C "$mod_path" show "${mod_target_rev}:go.mod" |
        awk '$1 ~ "/openslides-go" {print $2}' | tail -1 | awk -F- '{print $3}' | cut -c1-7)"
      echo "  $osgo_version $mod_path (go.mod)"
    fi

    [[ -z "$osgo_version_last" ]] || [[ "$osgo_version" == "$osgo_version_last" ]] ||
      ret_code=1
    osgo_version_last="$osgo_version"
  done <<< "$(git submodule foreach -q 'echo "$name $sm_path"')"

  return $ret_code
}

capsule_clear_console()
{
    local LINE_COUNT=$1
    for _ in $(seq 1 "$LINE_COUNT"); do
        tput el
        echo ""
    done
    tput cuu "$LINE_COUNT"
}

capsule_error()
{
    local PROCESS_ID=$1
    local LOG=$2
    local LINE_COUNT=$3
    if [ -n "$PROCESS_ID" ] && kill -0 "$PROCESS_ID" 2>/dev/null; then
        kill "$PROCESS_ID" 2>/dev/null
        wait "$PROCESS_ID"
    fi

    rm -f "$LOG"
    printf "\033[?25h" # Show Cursor
    exit 1
}

capsule()
{
  # Print command
  (
    IFS=$' '
    echo "${COL_BLUE}$ $*${COL_NORMAL}" >&2
  )

  # Setup
  LOG=$(mktemp)
  LINE_COUNT=15
  CLEAR_COUNT=$((LINE_COUNT + 10))

  printf "\033[?25l" # Hide Cursor

  # Safe Exit
  trap 'tput rc && capsule_clear_console "$CLEAR_COUNT" && capsule_error "$PROCESS_ID" "$LOG" "$CLEAR_COUNT"' INT TERM

  # Reserve Console lines
  for _ in $(seq 1 "$CLEAR_COUNT"); do
    echo ""
  done
  tput cuu "$CLEAR_COUNT"
  tput sc

  # Run build in background and log output
  $* > "$LOG" 2>&1 &

  PROCESS_ID=$!

  # Pipe output of process to user console continuously
  while ps -p "$PROCESS_ID" >/dev/null; do
      # Return cursor
      tput rc

      # Get outpute lines
      mapfile -t lines < <(tail -n "$LINE_COUNT" "$LOG")

      # Print empty or log lines
      for ((i = 0; i < "$CLEAR_COUNT"; i++)); do
          tput el

          if (( LINE_COUNT >= CLEAR_COUNT )); then echo "" && continue; fi

          if [ "$i" -lt ${#lines[@]} ]
          then
              echo "${lines[$i]}"
          else
              echo ""
          fi
      done

      sleep 0.25
  done

  # Wait for process to finish
  wait "$PROCESS_ID"
  EXIT_CODE="$?"

  # Clear progress
  tput rc
  capsule_clear_console "$CLEAR_COUNT"

  # Printe entire output on error
  if [ $EXIT_CODE != 0 ]
  then
      error "Command '$*' failed!"
      cat "$LOG"
  fi

  # Delete log file
  rm -f "$LOG"

  printf "\033[?25h" # Show Cursor

  return "$EXIT_CODE"
}
