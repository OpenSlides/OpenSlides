#!/bin/bash

set -e

declare -A TARGETS
TARGETS=(
  [client]="$(dirname "${BASH_SOURCE[0]}")/../client/docker/"
  [server]="$(dirname "${BASH_SOURCE[0]}")/../server/docker/"
  [proxy]="$(dirname "${BASH_SOURCE[0]}")/../caddy/"
  [autoupdate]="$(dirname "${BASH_SOURCE[0]}")/../autoupdate/"
  [media]="https://github.com/OpenSlides/openslides-media-service.git#stable/3.4.x"
  [pgbouncer]="https://github.com/OpenSlides/openslides-docker-compose.git#main:pgbouncer"
  [postfix]="https://github.com/OpenSlides/openslides-docker-compose.git#main:postfix"
  [repmgr]="https://github.com/OpenSlides/openslides-docker-compose.git#main:repmgr"
)

DOCKER_REPOSITORY="openslides"
DOCKER_TAG="latest"
CONFIG="/etc/osinstancectl"
OPTIONS=()
BUILT_IMAGES=()
DEFAULT_TARGETS=(server client autoupdate)

usage() {
  cat << EOF
Usage: $(basename ${BASH_SOURCE[0]}) [<options>] <service>...

Options:
  -D, --docker-repo  Specify a Docker repository
                     (default: unspecified, i.e., system default)
  -t, --tag          Tag the Docker image (default: $DOCKER_TAG)
  --ask-push         Offer to push newly built images to registry
  --no-cache         Pass --no-cache to docker-build
EOF
}

# Config file
if [[ -f "$CONFIG" ]]; then
  echo "Found ${CONFIG} file."
  source "$CONFIG"
fi

shortopt="hr:D:t:"
longopt="help,docker-repo:,tag:,ask-push,no-cache"
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
    --ask-push)
      ASK_PUSH=1
      shift 1
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
    ( . "$build_script" )
  else
    docker build --tag "$img" --pull "${OPTIONS[@]}" "$loc"
  fi
  BUILT_IMAGES+=("$img ON")
done

if [[ "${#BUILT_IMAGES[@]}" -ge 1 ]]; then
  printf "\nSuccessfully built images:\n\n"
  for i in "${BUILT_IMAGES[@]}"; do
    read -r img x <<< "$i"
    printf "  - $img\n"
  done
else
  echo "No images were built."
  exit 3
fi

[[ "$ASK_PUSH" ]] || exit 0

if hash whiptail > /dev/null 2>&1; then
  while read img; do
    echo "Pushing ${img}."
    docker push "$img"
  done < <( whiptail --title "OpenSlides build script" \
    --checklist "Select images to push to their registry." \
    25 78 16 --separate-output --noitem --clear \
    ${BUILT_IMAGES[@]} \
    3>&2 2>&1 1>&3 )
else
  echo
  for i in "${BUILT_IMAGES[@]}"; do
    read -r img x <<< "$i"
    read -p "Push image '$img' to repository? [Y/n] " REPL
    case "$REPL" in
      N|n|No|no|NO) exit 0;;
      *) docker push "$img" ;;
    esac
  done
fi
