#!/bin/bash

set -e

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used as a warning for users that a particular make target will be deprecated or renamed soon
# If there is an alternative to the given make target, it will be displayed

# Setup
ALTERNATIVE=$1

error "DEPRECATION WARNING: This make command is deprecated and will be removed soon!"
if [ -n "$ALTERNATIVE" ]; then warn "Please use the following command instead:" && warn "$ALTERNATIVE"; fi
