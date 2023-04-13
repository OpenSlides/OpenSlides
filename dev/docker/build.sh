#!/bin/bash

set -e

HOME="$(dirname "$(realpath "${BASH_SOURCE[0]}")")/../../"
declare -A TARGETS
TARGETS=(
  [proxy]="$HOME/proxy/"
  [client]="$HOME/openslides-client/"
  [backend]="$HOME/openslides-backend/"
  [auth]="$HOME/openslides-auth-service/"
  [autoupdate]="$HOME/openslides-autoupdate-service/"
  [manage]="$HOME/openslides-manage-service/"
  [datastore-reader]="$HOME/openslides-datastore-service/reader"
  [datastore-writer]="$HOME/openslides-datastore-service/writer"
  [media]="$HOME/openslides-media-service/"
  [vote]="$HOME/openslides-vote-service/"
  [icc]="$HOME/openslides-icc-service/"
)
CLIENT_VERSION_TXT="${TARGETS[client]}/client/src/assets/version.txt"

DOCKER_REPOSITORY="openslides"
DOCKER_TAG="$(cat VERSION)"
[[ "$(git rev-parse --abbrev-ref HEAD)" != staging ]] ||
  DOCKER_TAG="$DOCKER_TAG-staging-$(date +%Y%m%d)-$(git rev-parse HEAD | cut -c -7)"
CONFIG="/etc/osinstancectl"
OPTIONS=()
BUILT_IMAGES=()
DEFAULT_TARGETS=(proxy client backend auth autoupdate permission manage datastore-reader datastore-writer media vote icc)
ASK_PUSH=
YES=

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
EOF
}

# Config file
if [[ -f "$CONFIG" ]]; then
  echo "Found ${CONFIG} file."
  source "$CONFIG"
fi

shortopt="hr:D:t:"
longopt="help,docker-repo:,tag:,no-cache,ask-push,yes"
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
      YES=1
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
  cd $loc
  {
    printf '{\n'
    printf '\t"service": "%s,\n' "${i}"
    printf '\t"date": "%s",\n' "$(date)"
    printf '\t"commit": "%s",\n' "$(git rev-parse HEAD)"
    printf '\t"commit-abbrev": "%s",\n' "$(git rev-parse --abbrev-ref HEAD)"
    printf '}\n'
  } > version.json
  if [[ -w "$CLIENT_VERSION_TXT" ]]; then
    client_dev_version="$(< "$CLIENT_VERSION_TXT")"
    printf "$DOCKER_TAG (built $(date +%Y%m%d))" > "$CLIENT_VERSION_TXT"
  fi

  # Special instructions for local services
  build_script="${loc}/build.sh"
  if [[ -f "$build_script" ]]; then
    ( . "$build_script" )
  else
    docker build --tag "$img" --pull "${OPTIONS[@]}" "$loc"
  fi
  rm version.json
  if [[ -w "$CLIENT_VERSION_TXT" ]]; then
    echo "$client_dev_version" > "$CLIENT_VERSION_TXT"
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

[[ -n "$ASK_PUSH" ]] || exit 0

if [ -n $YES ] || ! hash whiptail > /dev/null 2>&1; then
  echo
  for i in "${BUILT_IMAGES[@]}"; do
    read -r img x <<< "$i"
    if [ -n $YES ]; then
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
