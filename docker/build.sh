
# Check if associative arrays arrays are supported
unset assoc
if ! declare -A assoc > /dev/null 2>&1 ; then
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!                                                            !!"
    echo "!!  This script requires associative arrays to be supported.  !!"
    echo "!!  Please check your bash version.                           !!"
    echo "!!                                                            !!"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    exit 1
fi

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
  -D                 Specify a Docker repository
                     (default: unspecified, i.e., system default)
  -t                 Tag the Docker image (default: $DOCKER_TAG)
  -P                 Offer to push newly built images to registry
  -C                 Pass --no-cache to docker-build

Notes:
  <service> defaults to 'server client'.

  You can build all services with 'all'. Currently supported are:
    client server media-service pgbouncer postfix repmgr

EOF
}

# Config file
if [[ -f "$CONFIG" ]]; then
  echo "Found ${CONFIG} file."
  source "$CONFIG"
fi

ARGS=`getopt hPCD:t: $*`
if [ $? -ne 0 ]; then
  usage
  exit 1
fi

set -- $ARGS
unset ARGS

# Parse options
while true; do
  case "$1" in
    -D)
      DOCKER_REPOSITORY="$2"
      shift 2
      ;;
    -t)
      DOCKER_TAG="$2"
      shift 2
      ;;
    -P)
      ASK_PUSH=1
      shift 1
      ;;
    -C)
      OPTIONS+="--no-cache"
      shift 1
      ;;
    -h)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      usage
      exit 1
      ;;
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
    DOCKER_BUILDKIT=0 docker build --tag "$img" --pull "${OPTIONS[@]}" "$loc"
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
