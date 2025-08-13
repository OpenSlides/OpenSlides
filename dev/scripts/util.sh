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
  local default_reply="$1" reply_opt="[y/N]" blank="y" REPLY=
  shift; [[ "$default_reply" != y ]] || {
    reply_opt="[Y/n]"; blank=""
  }

  read -rp "$* $reply_opt: "
  case "$REPLY" in
    Y|y|Yes|yes|YES|"$blank") return 0 ;;
    *) return 1 ;;
  esac
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