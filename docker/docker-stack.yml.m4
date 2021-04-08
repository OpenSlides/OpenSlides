dnl This is a YAML template file.  Simply translate it with m4 to create
dnl a standard configuration.  Customizations can and should be added in .env
dnl by setting the appropriate variables.
dnl
dnl Usage:
dnl   m4 docker-stack.yml.m4 > docker-stack.yml
dnl   ( set -a; source .env; m4 docker-stack.yml.m4 ) > docker-stack.yml
dnl
dnl ----------------------------------------
divert(-1)dnl
define(`read_env', `esyscmd(`printf "%s" "$$1"')')
define(`ifenvelse', `ifelse(read_env(`$1'),, `$2', read_env(`$1'))')

define(`BACKEND_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_BACKEND_NAME', openslides-backend):dnl
ifenvelse(`DOCKER_OPENSLIDES_BACKEND_TAG', latest-4))
define(`PROXY_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_PROXY_NAME', openslides-proxy):dnl
ifenvelse(`DOCKER_OPENSLIDES_PROXY_TAG', latest-4))
define(`CLIENT_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_CLIENT_NAME', openslides-client):dnl
ifenvelse(`DOCKER_OPENSLIDES_CLIENT_TAG', latest-4))
define(`AUTH_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_AUTH_NAME', openslides-auth):dnl
ifenvelse(`DOCKER_OPENSLIDES_AUTH_TAG', latest-4))
define(`AUTOUPDATE_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_AUTOUPDATE_NAME', openslides-autoupdate):dnl
ifenvelse(`DOCKER_OPENSLIDES_AUTOUPDATE_TAG', latest-4))
define(`DATASTORE_READER_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_DATASTORE_READER_NAME', openslides-datastore-reader):dnl
ifenvelse(`DOCKER_OPENSLIDES_DATASTORE_READER_TAG', latest-4))
define(`DATASTORE_WRITER_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_DATASTORE_WRITER_NAME', openslides-datastore-writer):dnl
ifenvelse(`DOCKER_OPENSLIDES_DATASTORE_WRITER_TAG', latest-4))
define(`MEDIA_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_MEDIA_NAME', openslides-media):dnl
ifenvelse(`DOCKER_OPENSLIDES_MEDIA_TAG', latest-4))
define(`MANAGE_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_MANAGE_NAME', openslides-manage):dnl
ifenvelse(`DOCKER_OPENSLIDES_MANAGE_TAG', latest-4))
define(`PERMISSION_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_PERMISSION_NAME', openslides-permission):dnl
ifenvelse(`DOCKER_OPENSLIDES_PERMISSION_TAG', latest-4))

define(`PROJECT_DIR', ifdef(`PROJECT_DIR',PROJECT_DIR,.))
define(`ADMIN_SECRET_AVAILABLE', `syscmd(`test -f 'PROJECT_DIR`/secrets/admin.env')sysval')
divert(0)dnl
dnl ----------------------------------------
# This configuration was created from a template file.  Before making changes,
# please make sure that you do not have a process in place that would override
# your changes in the future.  The accompanying .env file might be the correct
# place for customizations instead.
version: '3.4'

services:
  proxy:
    image: PROXY_IMAGE
    networks:
      - uplink
      - frontend
    ports:
      - "127.0.0.1:ifenvelse(`EXTERNAL_HTTP_PORT', 8000):8000"
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
      replicas: ifenvelse(`OPENSLIDES_PROXY_REPLICAS', 1)

  client:
    image: CLIENT_IMAGE
    networks:
      - frontend
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
      replicas: ifenvelse(`OPENSLIDES_CLIENT_REPLICAS', 1)

  backend:
    image: BACKEND_IMAGE
    env_file: services.env
    networks:
      - frontend
      - backend
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
      replicas: ifenvelse(`OPENSLIDES_BACKEND_REPLICAS', 1)
    secrets:
      - auth_token_key
      - auth_cookie_key

  datastore-reader:
    image: DATASTORE_READER_IMAGE
    env_file: services.env
    environment:
      - NUM_WORKERS=8
    networks:
      - backend
      - datastore-reader
      - postgres
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
      replicas: ifenvelse(`OPENSLIDES_DATASTORE_READER_REPLICAS', 1)

  datastore-writer:
    image: DATASTORE_WRITER_IMAGE
    env_file: services.env
    networks:
      - backend
      - postgres
      - message-bus
    environment:
      - COMMAND=create_initial_data
      - DATASTORE_INITIAL_DATA_FILE=/data/initial-data.json
    volumes:
      - ./initial-data.json:/data/initial-data.json
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s

  postgres:
    image: postgres:11
    environment:
      - POSTGRES_USER=openslides
      - POSTGRES_PASSWORD=openslides
      - POSTGRES_DB=openslides
    networks:
      - postgres
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s

  autoupdate:
    image: AUTOUPDATE_IMAGE
    env_file: services.env
    networks:
      - frontend
      - backend
      - message-bus
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
      replicas: ifenvelse(`OPENSLIDES_AUTOUPDATE_REPLICAS', 1)
    secrets:
      - auth_token_key
      - auth_cookie_key

  auth:
    image: AUTH_IMAGE
    env_file: services.env
    networks:
      - datastore-reader
      - frontend
      - message-bus
      - auth
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
      replicas: ifenvelse(`OPENSLIDES_AUTH_REPLICAS', 1)
    secrets:
      - auth_token_key
      - auth_cookie_key

  cache:
    image: redis:latest
    networks:
      - auth
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s

  message-bus:
    image: redis:latest
    networks:
      - message-bus
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s

  media:
    image: MEDIA_IMAGE
    env_file: services.env
    networks:
      - frontend
      - backend
      - postgres
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
      replicas: ifenvelse(`OPENSLIDES_MEDIA_REPLICAS', 1)

  manage:
    image: MANAGE_IMAGE
    env_file: services.env
    networks:
    - backend
    - auth
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s

  # TODO: Remove depenency to auth in "networks"
  # Should be doable when the manage service is fixed
  manage-setup:
    image: MANAGE_IMAGE
    entrypoint: /root/entrypoint-setup
    env_file: services.env
    environment:
      ENABLE_ELECTRONIC_VOTING: "ifenvelse(`ENABLE_ELECTRONIC_VOTING',)"
    networks:
    - backend
    - auth
    ifelse(ADMIN_SECRET_AVAILABLE, 0,secrets:
      - admin)
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s

  permission:
    image: PERMISSION_IMAGE
    env_file: services.env
    networks:
    - backend
    - auth
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
      replicas: ifenvelse(`OPENSLIDES_PERMISSION_REPLICAS', 1)

networks:
  uplink:
  frontend:
    driver_opts:
      encrypted: ""
    internal: true
  backend:
    driver_opts:
      encrypted: ""
    internal: true
  postgres:
    driver_opts:
      encrypted: ""
    internal: true
  datastore-reader:
    driver_opts:
      encrypted: ""
    internal: true
  message-bus:
    driver_opts:
      encrypted: ""
    internal: true
  auth:
    driver_opts:
      encrypted: ""
    internal: true

secrets:
  auth_token_key:
    file: ./secrets/auth_token_key
  auth_cookie_key:
    file: ./secrets/auth_cookie_key
  ifelse(ADMIN_SECRET_AVAILABLE, 0,admin:
    file: ./secrets/admin.env)
