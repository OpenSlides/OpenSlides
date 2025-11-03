#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")"/../util.sh

# Iterates all submodules and executes the make-target 'build-aio' using parameter context as build target
# Ignores meta and openslides-go directory

# Setup
CONTEXT=$1
IGNORE_FAILED_BUILDS=$2

shift 2
ARGS="${*}"
BUILD_FAIL=$(mktemp)
RUNNING_BUILD_PROCESSES=$(mktemp)
ERROR_LOG_FILE_NAMES=$(mktemp)


trap 'cleanup_error_logs && eval "rm -f $BUILD_FAIL" && eval "rm -f $ERROR_LOG_FILE_NAMES" && eval "rm -f $RUNNING_BUILD_PROCESSES"' INT TERM EXIT

if [ "${CONTEXT}" != "prod" ] && [ "${CONTEXT}" != "dev" ] && [ "${CONTEXT}" != "tests" ]; then
    warn "No build context specified. Building for prod per default."
    CONTEXT="prod"
fi

info "Building image(s) for context $CONTEXT"

cleanup_error_logs() {
while read -r name; do
  {
    if [ -s ERROR_LOG_${name} ]; then rm -f ERROR_LOG_${name}; fi
  }
done <<< "$(git submodule foreach --recursive -q 'echo "$name"')"
}

on_build_error() {
    OP_DIR=$1
    SERVICE=$2
    echo "Error building $SERVICE" >> "$BUILD_FAIL"
    error "Building $OP_DIR failed"

    if [ -n "$IGNORE_FAILED_BUILDS" ]; then exit 0; fi

    local MY_PID=$BASHPID
    while read -r pid; do
        if [[ "$MY_PID" == "$pid" ]]
        then
        continue
        elif kill -0 "$pid"
        then
            kill -TERM -"$pid"
        else
        continue
        fi
    done < "$RUNNING_BUILD_PROCESSES"
}

build_image() {
    OP_DIR=$1
    SERVICE=$2
    MODULE=$3
    PORT=$4

    # Strip "openslides-" and "-service"
    SERVICE="${SERVICE#*-}"
    SERVICE="${SERVICE%-*}"

    if [ -n "$MODULE" ]; then SERVICE="$SERVICE$MODULE"; fi

    # Create an error log for this build specifically
    declare "ERROR_LOG_${SERVICE}=$(mktemp)"
    LOG_PATH="ERROR_LOG_${SERVICE}"
    echo "${!LOG_PATH}" >> "$ERROR_LOG_FILE_NAMES"

    # Build docker image, redirect output to error log
    if [[ ${#ARGS} -gt 3 ]]
    then
      setsid docker build $OP_DIR "${ARGS}" --tag "openslides-$SERVICE-$CONTEXT" --build-arg CONTEXT="$CONTEXT" --build-arg MODULE="$MODULE" --build-arg PORT="$PORT" --target "$CONTEXT" > "${!LOG_PATH}" 2>&1 &
    else
      setsid docker build $OP_DIR --tag "openslides-$SERVICE-$CONTEXT" --build-arg CONTEXT="$CONTEXT" --build-arg MODULE="$MODULE" --build-arg PORT="$PORT" --target "$CONTEXT" > "${!LOG_PATH}" 2>&1 &
    fi
    echo $! >> "$RUNNING_BUILD_PROCESSES"

    wait $!
    ERR=$?
    [[ "$ERR" != 0 ]] && [[ ! -s "$BUILD_FAIL" ]] && on_build_error $OP_DIR $SERVICE

}

while read -r toplevel sm_path name; do
# Extract submodule name
  {
    DIR="$toplevel/$sm_path"

    [[ "$name" == 'openslides-go' ]] && exit 0
    [[ "$name" == 'openslides-meta' ]] && exit 0

    # Execute test
    if [ "$name" == 'openslides-datastore-service' ]
    then
      build_image $DIR $name "reader" "9010"
      build_image $DIR $name "writer" "9011"
    else
      build_image $DIR $name
    fi
  } &
done <<< "$(git submodule foreach --recursive -q 'echo "$toplevel $sm_path $name"')"


wait

if [[ -s "$BUILD_FAIL" ]]
then
    cat $BUILD_FAIL

    if [ -z "$IGNORE_FAILED_BUILDS" ]
    then
      error "Build errors:";
    fi
    while read -r LOG_PATH; do
      # Ignore all errors that were caused by canceled context. This error occurs when the build has been manually stopped early.
      # Since this script stops all builds manually when a single one fails, these errors should be ignored
      if grep -q "Canceled: context" "${LOG_PATH}"; then continue; fi
      if grep -q " writing image " "${LOG_PATH}"; then continue; fi

      cat "${LOG_PATH}"
    done < "$ERROR_LOG_FILE_NAMES"

    if [ -n "$IGNORE_FAILED_BUILDS" ]
    then
      success "Build done!"
      warn "There has been a build error! However, build of other images has not been stopped as requested. "
    fi
    exit 2
else
  success "Build done!"
fi

exit 0
