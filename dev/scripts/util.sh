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
  printf "\n"
  local DEFAULT_REPLY="$1" REPLY_OPT="[y/N]" BLANK="y" REPLY=
  shift; [[ "$DEFAULT_REPLY" != y ]] || {
    REPLY_OPT="[Y/n]"; BLANK=""
  }

  read -rp "$* $REPLY_OPT: "
  case "$REPLY" in
    Y|y|Yes|yes|YES|"$BLANK") return 0 ;;
    *) return 1 ;;
  esac
}

input(){
  read -rp "$*: "
  echo "$REPLY"
}

# echocmd first echos args in blue on stderr. Then args are treated like a
# provided command and executed.
# This allows callers of echocmd to still handle their provided command's stdout
# as if executed directly.
echocmd() {
  (
  IFS=$' '
  echo "${COL_BLUE}$ $*${COL_NORMAL}" >&2
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

fancy() {
    echo ""
    echo "        -*~=$§{}§$=~*-"
    echo ""
    echo "  $*"
    echo ""
    echo "        -*~=$§{}§$=~*-"
    echo ""
}

shout() {
    echo ""
    echo "${COL_CYAN}========================================================${COL_NORMAL}"
    echo ""
    echo "${COL_CYAN}$*${COL_NORMAL}"
    echo ""
    echo "${COL_CYAN}========================================================${COL_NORMAL}"
    echo ""
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
