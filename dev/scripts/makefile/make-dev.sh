#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used in Makefile Targets to run development contex in various ways

# Functions
help ()
{
    info "\
Builds and starts development related images. Intended to be called from Makefiles

Parameters:
    #1 TARGET       : Name of the Makefile Target that called this script.
    #2 SERVICE      : Name of the Service that called this script. If empty, the main repository assumed to be the caller
    #3 COMPOSE_FILE : Path to the docker compose file that should be used (Path relative to the services directory)
    #4 ARGS         : Additional parameters that will be appended to the called docker run or docker compose calls
    #5 USED_SHELL   : Optional parameter to declare the type of shell that is supposed to entered when attaching / entering container. Default is 'sh'
    #6 VOLUMES      : Optional paramter to declare Volumes and other run/compose up specific commands

Flags:
    -v              : Appends '--volumes' whenever a docker compose setup is closed

Available dev functions:
    dev             : Builds and starts development images
    dev-help        : Print help
    dev-detached    : Builds and starts development images with detach flag
    dev-attached    : Builds and starts development images; enters shell of started image
                          If a docker compose file is declared, the \$ARGS parameter determines
                          the specific container id you will enter (default value is equal the service name)
                          as well as the shell you want to enter (sh, bash, entrypoint etc.)
    dev-standalone  : Builds and starts development images; closes them immediatly afterwards
    dev-stop        : Stops any currently running images associated with the service or docker compose file
    dev-exec        : Executes command inside container.
                          Use \$ARGS to declare command that should be used. If using a docker compose setup, declare which container the command should be used in.
    dev-enter       : Enters bash of started container.
                          If a docker compose file is declared, the \$ARGS parameter determines
                          the specific container id you will enter (default value is equal the service name)
    dev-build       : Builds the development image
    "
}

build_capsuled()
{
    local FUNC=$1

    # Record time
    local PRE_TIMESTAMP=$(date +%s)

    # Build Image
    info "Building image"
    capsule "$FUNC"
    local RESPONSE=$?

    local POST_TIMESTAMP=$(date +%s)
    local BUILD_TIME=$(( $POST_TIMESTAMP - $PRE_TIMESTAMP ))
    # Output
    if [ "$RESPONSE" != 0 ]
    then
        error "Building image failed: $ERROR"
    elif [ "$BUILD_TIME" -le 3 ]
    then
        success "Image cached"
    else
        success "Build image successfully"
    fi
}

build()
{
    # Build all submodules
    if [ "$SERVICE_FOLDER" = "" ]
    then
        build_capsuled "dev/scripts/makefile/build-all-submodules.sh dev"
        return
    fi

    # Build specific submodule
    (
        cd "$SERVICE_FOLDER" || abort 1

        build_capsuled "make build-dev"
    )
}

clean()
{
    ask y "Confirm deleting ALL images and containers?" || abort 0
    if [ "$(docker ps -aq)" = "" ]
    then
        info "No containers to stop"
    else
        docker stop $(docker ps -aq)
    fi

    if [ "$(docker ps -a -q)" = "" ]
    then
        info "No containers to remove"
    else
        docker rm $(docker ps -a -q)
    fi

    if [ "$(docker images -aq)" = "" ]
    then
        info "No images to remove"
    else
        docker rmi -f $(docker images -aq)
    fi
}

run()
{
    info "Running container"
    local FLAGS=$1
    local SHELL=$2
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        echocmd eval "$DC up $FLAGS $VOLUMES $ARGS"
    else
        # Already active check
        if [ "$(docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}")" = "$CONTAINER_NAME" ]
        then
            { ask y "Container already running, restart it?" && stop; } || { echo "Continue with existing container" && return; }
        fi

        # Single Container
        echocmd docker run --name "$CONTAINER_NAME"  "$FLAGS" "$VOLUMES" "$ARGS" "$IMAGE_TAG" "$SHELL"
    fi
}

attach()
{
    local TARGET_CONTAINER=$1
    info "Attaching to running container"
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        { [ -z "$TARGET_CONTAINER" ] && \info "No container was specified; Service container will be taken as default" && TARGET_CONTAINER="$SERVICE"; }
        echocmd eval "$DC exec $TARGET_CONTAINER $USED_SHELL"
    else
        # Single Container
        echocmd docker exec -it "$CONTAINER_NAME" "$USED_SHELL"
    fi

    local CONTAINER_STATUS="$?"
    if [ "$CONTAINER_STATUS" != 0 ]; then warn "Container exit status: $CONTAINER_STATUS"; fi
}

exec()
{
    local FUNC=$1
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        echocmd eval "$DC exec $FUNC"
    else
        # Single Container
        echocmd docker exec "$CONTAINER_NAME" "$FUNC"
    fi
}

stop()
{
    info "Stop running container"
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        echocmd eval "$DC down $CLOSE_VOLUMES"
    else
        # Single Container
        echocmd docker stop "$CONTAINER_NAME"
        echocmd docker rm "$CONTAINER_NAME"
    fi
}

# Setup
## Parameters
TARGET=$1
SERVICE=$2
ARGS=$3

# Variables
SERVICE_FOLDER=""
CONTAINER_NAME="make-dev-$SERVICE"
LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
USED_SHELL="sh"

# Strip 'dev', '-' and any '.o' or similar file endings that may have been automatically added from implicit rules by GNU
FUNCTION=${TARGET#"dev"}
FUNCTION=${FUNCTION#"-"}
FUNCTION=${FUNCTION%.*}

# - Extrapolate parameters depending on servicce
case "$SERVICE" in
    "auth")         SERVICE_FOLDER="./openslides-auth-service" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/docker-compose.dev.yml" ;;
    "autoupdate")   SERVICE_FOLDER="./openslides-autoupdate-service" ;;
    "backend")      SERVICE_FOLDER="./openslides-backend" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/dev/docker-compose.dev.yml" &&
                    USED_SHELL="./entrypoint.sh bash --rcfile .bashrc" &&
                    CLOSE_VOLUMES="--volumes" ;;
    "client")       SERVICE_FOLDER="./openslides-client" &&
                    VOLUMES="-v `pwd`/client/src:/app/src -v `pwd`/client/cli:/app/cli -p 127.0.0.1:9001:9001/tcp" ;;
    "datastore")    SERVICE_FOLDER="./openslides-datastore-service" ;;
    "icc")          SERVICE_FOLDER="./openslides-icc-service" ;;
    "manage")       SERVICE_FOLDER="./openslides-manage-service" ;;
    "media")        SERVICE_FOLDER="./openslides-media-service" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/docker-compose.test.yml" &&
                    USED_SHELL="bash" &&
                    if [ "$FUNCTION" = "attached" ]; then FUNCTION="media-attached"; fi ;;
    "proxy")        SERVICE_FOLDER="./openslides-proxy" ;;
    "search")       SERVICE_FOLDER="./openslides-search-service" ;;
    "vote")         SERVICE_FOLDER="./openslides-vote-service" ;;
    "")             COMPOSE_FILE="dev/docker/docker-compose.dev.yml" ;;
    "*") ;;
esac

info "Running $FUNCTION"

# Helpers
USER_ID=$(id -u)
GROUP_ID=$(id -g)
DC="CONTEXT=dev USER_ID=$USER_ID GROUP_ID=$GROUP_ID docker compose -f ${COMPOSE_FILE}"
IMAGE_TAG="openslides-$SERVICE-dev"

# - Run specific function
case "$FUNCTION" in
    "help")        help ;;
    "clean")       clean ;;
    "standalone")  build && run && stop ;;
    "detached")    build && run "-d" && info "Containers started" ;;
    "attached")    build && run "-d" && attach "$ARGS" && stop ;;
    "stop")        stop ;;
    "exec")        exec "$ARGS" ;;
    "enter")       attach "$ARGS" ;;
    "build")       build ;;
    "media-attached") build && run "-d" && EXEC_COMMAND='-T tests wait-for-it "media:9006"' && exec "$EXEC_COMMAND" && attach "tests" && stop ;; # Special case for media (for now)
    "")            build && run ;;
    *)             warn "No command found matching $FUNCTION" && help ;;
esac

exit $?