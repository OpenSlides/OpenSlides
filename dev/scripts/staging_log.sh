#!/bin/bash

command -v gawk > /dev/null || {
  echo "Error: 'gawk' not installed!"
  exit 1
}

REMOTE_NAME=upstream
git ls-remote --exit-code "$REMOTE_NAME" &>/dev/null ||
  REMOTE_NAME=origin

STABLE=$(gawk -v FS=. -v OFS=. '{$3="x"  ; print $0}' VERSION)
git fetch -q $REMOTE_NAME stable/$STABLE || exit 1

STAGING="$(git show "$REMOTE_NAME/stable/$STABLE:VERSION" | gawk -v FS=. -v OFS=. '{$3=$3+1 ; print $0}')"

git fetch -q $REMOTE_NAME staging/$STAGING || exit 1

git log --graph --oneline -U0 --submodule $REMOTE_NAME/stable/$STABLE..$REMOTE_NAME/staging/$STAGING | \
  gawk -v version="$STAGING" '
    /^*.*Staging update [0-9]{8}/ { printf("\n# %s-staging-%s-%s\n", version, $NF, substr($2, 0, 7)) }
    /^*/ { printf("  %s\n",$0) }
    /^\| Submodule/ {printf("    %s %s\n", $3, $4)}
    /^\|   >/ { $1=""; $2=""; printf("      %s\n", $0 )}
 '
