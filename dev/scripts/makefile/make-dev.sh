#!/bin/bash

set -eo pipefail

# Import OpenSlides utils package
# shellcheck disable=SC1091
. "$(dirname "$0")/../util.sh"

# Processes various development operations

# Functions
help ()
{
    echo "\
Builds and starts development related images. Intended to be called from main repository makefile

Parameters:
    #1 OPERATION                : Operation to execute. Equal to the name of the makefile target that called this script
    #2 CONTAINER                : Optional name of the operation's target container
                                  This is the only non-flag and non-environment variable parameter provided when calling this script

Environment Variables (can be set when invoking make target):
    RUN_ARGS                 : Additional parameters that will be appended to dev-run calls
    SERVICE_COMPOSE_SETUP    : Specifies a service whose docker compose setup should be used instead of the main repositories docker compose setup
    EXEC_COMMAND             : Specifies the command which is executed with the dev-exec operation

Example: make   dev-exec    vote     SERVICE_COMPOSE_SETUP=backend   EXEC_COMMAND='ls'
                   ^          ^               ^                              ^
                Param #1   Param #2      Env Variable                   Env Variable
    ( This executes 'ls' in a vote-container created and maintained by a running backend compose setup )

Long Flags:
    no-cache             : Prevents use of cache when building docker images
    compose-local-branch : Compose setups pull service images from the main branch by default.
                           When 'compose-local-branch' is set to true, the checked out branch of the service will be pulled instead.
                           Example: Backend-Service is locally checked-out to 'feature/xyz'.
                           Its dev compose setup pulls 'vote' from github by referencing 'openslides-vote-service.git#main'.
                           If 'compose-local-branch' is set to true, the path 'openslides-vote-service.git#feature/xyz' will be used instead.
    no-log-prefix        : When printing container logs, the associated container name is omitted
    debug-dry-run        : Prints all commands that would run but prevents their actual execution

Available dev operations:
    dev              : Builds and starts development images.
    dev-help         : Print help.
    dev-detached     : Builds and starts development images with detach flag. This causes started containers to run in the background.
    dev-attached     : Builds and starts development images; enters shell of started image.
                          If a docker compose file is declared, the CONTAINER parameter determines
                          the specific container id you will enter (default value is equal the service name)
    dev-restart      : Restarts all containers. If CONTAINER is set, only the specified service will be restarted
    dev-full-restart : Stops any currently running containers or docker compose setup; restarts it immediately afterwards.
    dev-stop         : Stops any currently running containers or docker compose setup associated with the service.
    dev-clean        : Stops any currently running containers or docker compose setup associated with the service. Also removes (orphaned) volumes.
    dev-exec         : Executes command inside container.
                          Use \$EXEC_COMMAND to declare command that should be executed.
                          Example: 'dev-exec service-name EXEC_COMMAND=\"echo hello\"' will run \"echo hello\" inside the container named \"service-name\"
    dev-enter        : Enters shell of a running container.
                          If a docker compose file is declared, the CONTAINER parameter determines
                          the specific container id you will enter (default value is equal the service name).
    dev-build        : Builds all images. If CONTAINER is set, only the image for the specified container will be build
    dev-log          : Prints docker compose log output. If CONTAINER is set, only the specified container will be logged
    dev-log-attach   : Prints docker compose log output and attaches console to the containers log output feed.
                       If CONTAINER is set, only the specified container will be logged
    dev-docker-reset : Debugging function. Closes and removes ALL containers. Optionally deletes ALL images as well.
                       Optionally prunes your docker system.
    "
}

proxy_setup()
{
    (
        if [ -d "./openslides-proxy" ]
        then
            cd "./openslides-proxy" || exit 1

            echocmd ./make-localhost-cert.sh &>/dev/null
        fi
    )
}

docker_reset()
{
    info "Stopping containers"
    if [ "$(docker ps -aq)" = "" ]
    then
        info "No containers to stop"
    else
        # shellcheck disable=SC2046
        docker stop $(docker ps -aq)
    fi

    info "Removing containers"
    if [ "$(docker ps -a -q)" = "" ]
    then
        info "No containers to remove"
    else
        # shellcheck disable=SC2046
        docker rm $(docker ps -a -q)
    fi

    # shellcheck disable=SC2015
    ask n "Do you want to delete ALL images as well?" &&
    (
        info "Removing images"
        if [ "$(docker images -aq)" = "" ]
        then
            info "No images to remove"
        else
            # shellcheck disable=SC2046
            echocmd docker rmi -f $(docker images -aq)
        fi
    ) || true
    # shellcheck disable=SC2015
    ask n "Do you want a full docker system prune as well?" &&
    (
        info "Running docker system prune"
        echocmd docker system prune -f -a --volumes
    ) || true
}

build()
{
    local BUILD_ARGS="";

    if [ -n "$CONTAINER" ]; then BUILD_ARGS="$CONTAINER"; fi
    if [ -n "$NO_CACHE" ]
    then
        if [ "$BUILD_ARGS" == "" ]
        then
            BUILD_ARGS="--no-cache"
        else
            BUILD_ARGS="$BUILD_ARGS --no-cache"
        fi
    fi

    # Build all submodules
    if [ -n "$SERVICE_COMPOSE_SETUP" ]
    then
        if [ -n "$COMPOSE_FILE" ]
        then
            # Build compose setup of other service
            # shellcheck disable=SC2086
            echocmd docker compose -f "$(dirname "$0")/../../../$COMPOSE_FILE" build $BUILD_ARGS
        else
            # Build specific image
            (
                cd "$SERVICE_FOLDER" || abort 1

                make build-dev ARGS="$BUILD_ARGS"
            )
        fi
    else
        # Ensure localhost-cert has been called at least once
        proxy_setup

        # shellcheck disable=SC2086
        echocmd docker compose -f "$(dirname "$0")/../../docker/docker-compose.dev.yml" build $BUILD_ARGS
    fi
}

run()
{
    info "Running container"
    local FLAGS=$1
    if [ -n "$COMPOSE_FILE" ]
    then
        local BUILD_ARGS="";

        if [ -n "$NO_CACHE" ]; then BUILD_ARGS="--build --force-recreate"; fi

        # Compose
        # shellcheck disable=SC2086
        echocmd docker compose -f "${COMPOSE_FILE}" up ${LOG_PREFIX} ${BUILD_ARGS} ${FLAGS} ${VOLUMES} ${RUN_ARGS}
    else
        # Already active check
        # Either stop existing containers and continue with run() or use existing containers from now on and exit run() early
        if [ "$(docker ps -a --filter "name=$CONTAINER_TAG" --format "{{.Names}}")" = "$CONTAINER_TAG" ]
        then
            ask y "Container already running, restart it?" || local DECLINE_ASK=1
            if [ -z "$DECLINE_ASK" ]
            then
                stop
            else
                echo "Continue with existing container"
                return
            fi
        fi

        # Single Container
        # shellcheck disable=SC2086
        echocmd docker run --name "$CONTAINER_TAG" $FLAGS $VOLUMES $RUN_ARGS $IMAGE_TAG
    fi
}

restart()
{
    info "Restarting container(s)"

    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        if [ -n "$CONTAINER" ]
        then
            echocmd docker compose -f "${COMPOSE_FILE}" restart "${CONTAINER}"
        else
            echocmd docker compose -f "${COMPOSE_FILE}" restart
        fi
    else
        # Single Container
        echocmd docker restart "$CONTAINER_TAG"
    fi
}

attach()
{
    local TARGET_CONTAINER="$CONTAINER"

    # Special case: A submodules docker compose setup is used and no specific container has been declared.
    # Example: "Calling 'make dev-enter' while in ./openslides-backend"
    # In this case, the default container should be assumed to be 'backend' even if user hasn't specifically stated it
    if [ -n "$SERVICE_COMPOSE_SETUP" ] && [ "$CONTAINER" = "" ]
    then
        TARGET_CONTAINER="$DEFAULT_CONTAINER"
    fi

    info "Attaching to running container"
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose

        # Determine container to enter, in case no container was specified as a paramater
        if [ -z "$TARGET_CONTAINER" ]
        then
            # Main repository case, use input prompt to determine container
            TARGET_CONTAINER=$(input "Which service container should be entered?")
            { [ -z "$TARGET_CONTAINER" ] && \info "No service container declared, exiting" && return; }
        else
            # Submodule case
            info "No container was specified; Service container will be taken as default"
        fi

        # shellcheck disable=SC2086
        echocmd docker compose -f "${COMPOSE_FILE}" exec "${TARGET_CONTAINER}" ${USED_SHELL}
    else
        # Single Container
        # shellcheck disable=SC2086
        echocmd docker exec -it "$CONTAINER_TAG" $USED_SHELL
    fi

    local CONTAINER_STATUS="$?"
    if [ "$CONTAINER_STATUS" != 0 ]; then warn "Container exit status: $CONTAINER_STATUS"; fi
}

exec_func()
{
    local TARGET_CONTAINER="$CONTAINER"
    local FUNC=$EXEC_COMMAND

    # Special case: A submodules docker compose setup is used and no specific container has been declared.
    # Example: "Calling 'make dev-exec' while in ./openslides-backend"
    # In this case, the default container should be assumed to be 'backend' even if user hasn't specifically stated it
    if [ -n "$SERVICE_COMPOSE_SETUP" ] && [ "$CONTAINER" = "" ]
    then
        TARGET_CONTAINER="$DEFAULT_CONTAINER"
    fi

    if [ "$TARGET_CONTAINER" = "" ]
    then
        error "Missing target. Please specifiy the target like so: 'make dev-exec <service_name> EXEC_COMMAND=ls'"
        error "Where <service_name> is equal to the abbreviated name of the service you want to execute in (eg. backend, search, autoupdate)"
        exit 1
    fi

    if [ "$FUNC" = "" ]
    then
        error "Missing exec command. Please specifiy the command to execute like so: 'make dev-exec <service_name> EXEC_COMMAND=ls'"
        exit 1
    fi

    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        # shellcheck disable=SC2086
        echocmd docker compose -f "${COMPOSE_FILE}" exec "${TARGET_CONTAINER}" ${FUNC}
    else
        # Single Container
        # shellcheck disable=SC2086
        echocmd docker exec "$CONTAINER_TAG" $FUNC
    fi
}

stop()
{
    local CLEAN=$1
    local STOP_ARGS="$CLOSE_VOLUMES"

    info "Stop running container"
    if [ -n "$COMPOSE_FILE" ]
    then
        if [ -n "$CLEAN" ]
        then
            echocmd docker compose -f "${COMPOSE_FILE}" down --volumes --remove-orphans
        else
            # shellcheck disable=SC2086
            echocmd docker compose -f "${COMPOSE_FILE}" down ${STOP_ARGS}
        fi
    else
        # Single Container
        echocmd docker stop "$CONTAINER_TAG"
        echocmd docker rm "$CONTAINER_TAG"
    fi
}

log()
{
    local CONNECT=$1
    if [ -n "$CONNECT" ]; then CONNECT_FLAG="-f"; fi

    local TARGET_CONTAINER="$CONTAINER"

    if [ -n "$COMPOSE_FILE" ]
    then
        if [ -z "$TARGET_CONTAINER" ]
        then
            # Main repository case, use input prompt to determine container
            TARGET_CONTAINER=$(input "Enter container name if you want logs of a specific container. Leave empty to receive logs from every container")

            if [ -z "$TARGET_CONTAINER" ]
            then
                # No container specified. Log whole compose file
                # shellcheck disable=SC2086
                echocmd docker compose -f "$COMPOSE_FILE" logs ${LOG_PREFIX} ${CONNECT_FLAG}
                exit 0
            fi
        else
            # Submodule case
            info "No container was specified; Service container will be taken as default"
        fi

        # shellcheck disable=SC2086
        echocmd docker compose -f "$COMPOSE_FILE" logs ${TARGET_CONTAINER} ${LOG_PREFIX} ${CONNECT_FLAG}
    else
        # Single Container
        # shellcheck disable=SC2086
        echocmd docker container logs "${TARGET_CONTAINER}" ${LOG_PREFIX} ${CONNECT_FLAG}
    fi

}

# Setup
## Parameters
OPERATION=$1
CONTAINER=$2

## Parameters RUN_ARGS, EXEC_COMMAND and SERVICE_COMPOSE_SETUP are fetched from environment

# SERVICE contains all additionally provided make targets. This may include flags
# Extract flags here
TEMP_SERVICE=$CONTAINER
CONTAINER=""
for CMD in $TEMP_SERVICE; do
    case "$CMD" in
        "no-cache")      NO_CACHE=true ;;
        "compose-local-branch") USE_LOCAL_BRANCH_FOR_COMPOSE=true ;;
        "no-log-prefix") LOG_PREFIX="--no-log-prefix" ;;
        "debug-dry-run") DEBUG_DRY_RUN=1 ;;
        *)               CONTAINER="$CMD" ;;
    esac
done

# Variables
SERVICE_FOLDER=""
CONTAINER_TAG="make-os-dev-$CONTAINER"
USED_SHELL="sh"

# Remove ARGS flag from maketarget that's calling this script
# shellcheck disable=SC2034
MAKEFLAGS=
unset ARGS

# Strip 'dev', '-' and any '.o' or similar file endings that may have been automatically added from implicit rules by GNU and make targets
FUNCTION=${OPERATION#"dev"}
FUNCTION=${FUNCTION#"-"}
FUNCTION=${FUNCTION%.*}

DEFAULT_CONTAINER=

# - Extrapolate parameters depending on service compose setup
case "$SERVICE_COMPOSE_SETUP" in
    "auth")         SERVICE_FOLDER="./openslides-auth-service" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/docker-compose.dev.yml" &&
                    DEFAULT_CONTAINER="auth" ;;
    "autoupdate")   SERVICE_FOLDER="./openslides-autoupdate-service" ;;
    "backend")      if [ -z "$CONTAINER" ] || [ "$CONTAINER" == "backend" ]; then USED_SHELL="bash --rcfile .bashrc"; fi &&
                    CLOSE_VOLUMES="--volumes" &&
                    SERVICE_FOLDER="./openslides-backend" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/dev/docker-compose.dev.yml" &&
                    DEFAULT_CONTAINER="backend" ;;
    "client")       VOLUMES="-v $(pwd)/openslides-client/client/src:/app/src -v $(pwd)/openslides-client/client/cli:/app/cli -p 127.0.0.1:9001:9001/tcp" &&
                    SERVICE_FOLDER="./openslides-client" ;;
    "icc")          SERVICE_FOLDER="./openslides-icc-service" ;;
    "media")        USED_SHELL="bash" &&
                    if [ "$FUNCTION" = "attached" ]; then FUNCTION="media-attached"; fi && # Temporary fix for wait-for-it situation
                    SERVICE_FOLDER="./openslides-media-service" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/docker-compose.test.yml" &&
                    DEFAULT_CONTAINER="media" ;;
    "projector")    SERVICE_FOLDER="./openslides-projector-service" ;;
    "proxy")        SERVICE_FOLDER="./openslides-proxy" ;;
    "search")       SERVICE_FOLDER="./openslides-search-service" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/dev/docker-compose.dev.yml" &&
                    DEFAULT_CONTAINER="search" ;;
    "vote")         SERVICE_FOLDER="./openslides-vote-service" ;;
    "")             COMPOSE_FILE="./dev/docker/docker-compose.dev.yml" ;;
    *)              COMPOSE_FILE="./dev/docker/docker-compose.dev.yml" ;;
esac

if [ -n "$CONTAINER" ]; then info "Running $FUNCTION in docker compose setup for $CONTAINER"
else info "Running $FUNCTION"; fi

# Compose dev branch checkout
export COMPOSE_REFERENCE_BRANCH="main"
if [ -n "$USE_LOCAL_BRANCH_FOR_COMPOSE" ]
then
    if [ -n "$SERVICE_COMPOSE_SETUP" ]
    then
        if [ -z "$SERVICE_FOLDER" ]
        then
            error "No folder found for service '$CONTAINER'. Please check if the \$CONTAINER parameter has been properly set and refers to an existing service."
            warn "'compose-local-branch' only works for submodule services, not for main!"
            exit 1
        fi
        COMPOSE_REFERENCE_BRANCH=$(git -C "$SERVICE_FOLDER" branch --show-current)
    else
        COMPOSE_REFERENCE_BRANCH=$(git branch --show-current)
    fi
    info "Ditching 'main' for '$COMPOSE_REFERENCE_BRANCH' in compose setup to fetch external services"
fi

# Helpers
export USER_ID=$(id -u)
export GROUP_ID=$(id -g)
export CONTEXT=dev

IMAGE_TAG="openslides-$CONTAINER-dev"

# - Run specific function
case "$FUNCTION" in
    "help")             help ;;
    "detached")         build && run "-d" && info "Containers started" ;;
    "attached")         build && run "-d" && attach ;;
    "full-restart")     stop && build && run ;;
    "restart")          restart ;;
    "stop")             stop ;;
    "clean")            stop true ;;
    "exec")             exec_func ;;
    "enter")            attach ;;
    "build")            build ;;
    "log")              log ;;
    "log-attach")       log 1 ;;
    "docker-reset")     docker_reset ;;
    "media-attached")   build && run "-d" && EXEC_COMMAND='-T tests wait-for-it "media:9006"' && exec_func && attach "tests" && stop ;; # Special case for media (for now)
    "")                 build && run ;;
    *)                  warn "No command found matching $FUNCTION" && help ;;
esac

exit $?
