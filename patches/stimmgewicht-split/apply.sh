#!/bin/sh
# Applies the split vote weight patches ("Stimmgewicht aufteilen") to the
# submodules. Run from the repository root after `git submodule update --init`.
set -e

cd "$(dirname "$0")/../.."

for service in openslides-vote-service openslides-backend openslides-client openslides-projector-service; do
    if git -C "$service" apply --reverse --check "../patches/stimmgewicht-split/$service.patch" 2>/dev/null; then
        echo "$service: already applied"
        continue
    fi
    git -C "$service" apply "../patches/stimmgewicht-split/$service.patch"
    echo "$service: applied"
done
