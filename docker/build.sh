#!/bin/bash

set -e

declare -A TARGETS
TARGETS=(
  [client]="$(dirname "${BASH_SOURCE[0]}")/../client/docker/"
  [server]="$(dirname "${BASH_SOURCE[0]}")/../server/docker/"
  [media-service]="https://github.com/OpenSlides/openslides-media-service.git"
  [pgbouncer]="https://github.com/OpenSlides/openslides-docker-compose.git#:pgbouncer"
  [postfix]="https://github.com/OpenSlides/openslides-docker-compose.git#:postfix"
  [repmgr]="https://github.com/OpenSlides/openslides-docker-compose.git#:repmgr"
)

DOCKER_REPOSITORY="openslides"
DOCKER_TAG="latest"
CONFIG="/etc/osinstancectl"
OPTIONS=()
BUILT_IMAGES=()
DEFAULT_TARGETS=(server client)

usage() {
  cat << EOF
Usage: $(basename ${BASH_SOURCE[0]}) [<options>] <service>...

Options:
  -D, --docker-repo  Specify a Docker repository
                     (default: unspecified, i.e., system default)
  -t, --tag          Tag the Docker image (default: $DOCKER_TAG)
  --no-cache         Pass --no-cache to docker-build
EOF
}

# Config file
if [[ -f "$CONFIG" ]]; then
  echo "Found ${CONFIG} file."
  source "$CONFIG"
fi

shortopt="hr:D:t:"
longopt="help,docker-repo:,tag:,no-cache"
ARGS=$(getopt -o "$shortopt" -l "$longopt" -n "$ME" -- "$@")
if [ $? -ne 0 ]; then usage; exit 1; fi
eval set -- "$ARGS";
unset ARGS

# Parse options
while true; do
  case "$1" in
    -D|--docker-repo)
      DOCKER_REPOSITORY="$2"
      shift 2
      ;;
    -t|--tag)
      DOCKER_TAG="$2"
      shift 2
      ;;
    --no-cache)
      OPTIONS+="--no-cache"
      shift 1
      ;;
    -h|--help) usage; exit 0 ;;
    --) shift ; break ;;
    *) usage; exit 1 ;;
  esac
done

SELECTED_TARGETS=($@)
[[ "${#SELECTED_TARGETS[@]}" -ge 1 ]] || SELECTED_TARGETS=("${DEFAULT_TARGETS[@]}")
[[ "${SELECTED_TARGETS[@]}" != "all" ]] || SELECTED_TARGETS=("${!TARGETS[@]}")

for i in "${SELECTED_TARGETS[@]}"; do

  loc="${TARGETS[$i]}"
  [[ -n "$loc" ]] || {
    echo "ERROR: Cannot build ${i}: not configured."
    continue
  }

  img_name="openslides-${i}"
  img="${img_name}:${DOCKER_TAG}"
  if [[ -n "$DOCKER_REPOSITORY" ]]; then
    img="${DOCKER_REPOSITORY}/${img}"
  fi

  echo "Building $img..."
  # Special instructions for local services
  build_script="$(dirname "${BASH_SOURCE[0]}")/../${i}/build.sh"
  if [[ -f "$build_script" ]]; then
    . "$build_script"
  else
    docker build --tag "$img" --pull "${OPTIONS[@]}" "$loc"
  fi
  BUILT_IMAGES+=("$img")
done

for img in "${BUILT_IMAGES[@]}"; do
  read -p "Push image '$img' to repository? [y/N] " REPL
  case "$REPL" in
    Y|y|Yes|yes|YES)
      docker push "$img" ;;
  esac
done
