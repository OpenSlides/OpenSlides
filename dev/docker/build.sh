#!/bin/bash

set -e

HOME="$(dirname "$(realpath "${BASH_SOURCE[0]}")")/../../"
declare -A TARGETS
TARGETS=(
  [proxy]="$HOME/openslides-proxy/"
  [client]="$HOME/openslides-client/"
  [backend]="$HOME/openslides-backend/"
  [auth]="$HOME/openslides-auth-service/"
  [autoupdate]="$HOME/openslides-autoupdate-service/"
  [search]="$HOME/openslides-search-service/"
  [projector]="$HOME/openslides-projector-service/"
  [media]="$HOME/openslides-media-service/"
  [vote]="$HOME/openslides-vote-service/"
  [icc]="$HOME/openslides-icc-service/"
)

DOCKER_REPOSITORY="openslides"
DOCKER_TAG="$(cat VERSION)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BRANCH_PREFIX="$(echo "$BRANCH" | awk -F/ '{print $1}')"
if [[ "$BRANCH" == staging* ]]; then
  DOCKER_TAG="$DOCKER_TAG-$BRANCH_PREFIX-$(date +%Y%m%d)-$(git rev-parse HEAD | cut -c -7)"
elif [[ "$BRANCH" != stable* ]]; then
  DOCKER_TAG="$DOCKER_TAG-$BRANCH"
fi
CONFIG="/etc/osinstancectl"
OPTIONS=()
BUILT_IMAGES=()
DEFAULT_TARGETS=(proxy client backend auth autoupdate media projector vote icc search)
ASK_PUSH=
OPT_YES=
OPT_IMAGES=
LOCAL_GO=

usage() {
  cat << EOF
Usage: $(basename ${BASH_SOURCE[0]}) [<options>] <service>...

Options:
  -D, --docker-repo  Specify a Docker repository
                     (default: unspecified, i.e., system default)
  -t, --tag          Tag the Docker image (default: $DOCKER_TAG)
  --no-cache         Pass --no-cache to docker-build
  --ask-push         Offer to push newly built images to registry
  --yes              Push without requiring interaction confirmation
  --images           Only print out resulting images names without building
  --local-go         build with local openslides-go
EOF
}

# Config file
if [[ -f "$CONFIG" ]]; then
  echo "Found ${CONFIG} file."
  source "$CONFIG"
fi

shortopt="hr:D:t:"
longopt="help,docker-repo:,tag:,no-cache,ask-push,yes,images,local-go"
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
    --ask-push)
      ASK_PUSH=1
      shift 1
      ;;
    --yes)
      OPT_YES=1
      shift 1
      ;;
    --images)
      OPT_IMAGES=1
      shift 1
      ;;
    --local-go)
      LOCAL_GO=1
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

OPTIONS+=(--build-arg "VERSION=$DOCKER_TAG")

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

  if [[ -n "$OPT_IMAGES" ]]; then
    echo "$img"
    continue
  fi

  echo "Building $img..."
  cd $loc
  OPTIONS+=(--label version="$(cat ../VERSION)")
  OPTIONS+=(--label build-time="$(date -Is)")
  OPTIONS+=(--label commit="$(git rev-parse HEAD)")
  OPTIONS+=(--label service-branch="$(git describe --all --exact-match --dirty)")
  OPTIONS+=(--label mainrepo-branch="$(git -C ../ describe --all --exact-match --dirty)")
  if [ -d "./meta" ]; then OPTIONS+=(--label meta-commit="$(git -C ./meta rev-parse HEAD)"); fi

  if [[ "$LOCAL_GO" == "1" && $(grep -c openslides-go ./go.mod) -gt 0 ]]; then
    OPTIONS+=(--label go-commit="$(git -C ../lib/ rev-parse HEAD)")
    OPTIONS+=(--label meta-commit="$(git -C ../lib/openslides-go/meta rev-parse HEAD)")
    echo "Building with local openslides-go"
    tar -c . -C ../ ./lib -C ./dev/docker/workspaces . | docker build --tag "$img" --pull "${OPTIONS[@]}" --target prod-gowork -
  else
    if [[ $(grep -c openslides-go ./go.mod) -gt 0 ]]; then
      git -C ../lib/openslides-go fetch origin
      GO_COMMIT=$(grep "openslides-go" ./go.mod | awk -F - ' {print $NF} ')
      META_COMMIT=$(git -C ../lib/openslides-go rev-parse $GO_COMMIT:meta)
      OPTIONS+=(--label go-commit="$GO_COMMIT")
      OPTIONS+=(--label meta-commit="$META_COMMIT")
    fi
    docker build --tag "$img" --pull "${OPTIONS[@]}" "$loc"
  fi
  BUILT_IMAGES+=("$img ON")
done

if [[ -n "$OPT_IMAGES" ]]; then
  exit 0
fi

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

[[ -n "$ASK_PUSH" ]] || exit 0

if [ -n $OPT_YES ] || ! hash whiptail > /dev/null 2>&1; then
  echo
  for i in "${BUILT_IMAGES[@]}"; do
    read -r img x <<< "$i"
    if [ -n $OPT_YES ]; then
      REPL=y
    else
      read -p "Push image '$img' to repository? [Y/n] " REPL
    fi
    case "$REPL" in
      N|n|No|no|NO) exit 0;;
      *) docker push "$img" ;;
    esac
  done
else
  while read img; do
    echo "Pushing ${img}."
    docker push "$img"
  done < <( whiptail --title "OpenSlides build script" \
    --checklist "Select images to push to their registry." \
    25 78 16 --separate-output --noitem --clear \
    ${BUILT_IMAGES[@]} \
    3>&2 2>&1 1>&3 )
fi
