dnl This is a YAML template file.  Simply translate it with m4 to create
dnl a standard configuration.  Customizations can and should be added in .env
dnl by setting the appropriate variables.
dnl
dnl Usage:
dnl   m4 docker-compose.yml.m4 > docker-compose.yml
dnl   ( set -a; source .env; m4 docker-compose.yml.m4 ) > docker-compose.yml
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
    depends_on:
      - client
      - backend
      - autoupdate
      - auth
      - media
    networks:
      - uplink
      - frontend
    ports:
      - "127.0.0.1:ifenvelse(`EXTERNAL_HTTP_PORT', 8000):8000"

  client:
    image: CLIENT_IMAGE
    networks:
      - frontend
    depends_on:
      - backend
      - autoupdate

  backend:
    image: BACKEND_IMAGE
    depends_on:
      - datastore-reader
      - datastore-writer
    env_file: services.env
    environment:
      - AUTH_TOKEN_KEY=test123
      - AUTH_COOKIE_KEY=test123
    networks:
      - frontend
      - backend

  datastore-reader:
    image: DATASTORE_READER_IMAGE
    depends_on:
      - postgres
    env_file: services.env
    environment:
      - NUM_WORKERS=8
    networks:
      - backend
      - datastore-reader
      - postgres

  datastore-writer:
    image: DATASTORE_WRITER_IMAGE
    depends_on:
      - postgres
      - message-bus
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

  postgres:
    image: postgres:11
    environment:
      - POSTGRES_USER=openslides
      - POSTGRES_PASSWORD=openslides
      - POSTGRES_DB=openslides
    networks:
      - postgres

  autoupdate:
    image: AUTOUPDATE_IMAGE
    depends_on:
      - datastore-reader
      - message-bus
    env_file: services.env
    environment:
      - AUTH_KEY_TOKEN=test123
      - AUTH_KEY_COOKIE=test123
    networks:
      - frontend
      - backend
      - message-bus

  auth:
    image: AUTH_IMAGE
    depends_on:
      - datastore-reader
      - message-bus
      - cache
    env_file: services.env
    environment:
      - AUTH_TOKEN_KEY=test123
      - AUTH_COOKIE_KEY=test123
    networks:
      - datastore-reader
      - frontend
      - message-bus
      - auth

  cache:
    image: redis:latest
    networks:
      - auth

  message-bus:
    image: redis:latest
    networks:
      - message-bus

  media:
    image: MEDIA_IMAGE
    depends_on:
      - backend
      - postgres
    env_file: services.env
    networks:
      - frontend
      - backend
      - postgres

  manage:
    image: MANAGE_IMAGE
    depends_on:
    - auth
    - datastore-writer
    env_file: services.env
    networks:
    - backend
    - auth

  manage-setup:
    image: MANAGE_IMAGE
    entrypoint: /root/entrypoint-setup
    depends_on:
    - manage
    env_file: services.env
    networks:
    - backend
    ifelse(ADMIN_SECRET_AVAILABLE, 0,secrets:
      - admin)

  permission:
    image: PERMISSION_IMAGE
    depends_on:
    - datastore-reader
    env_file: services.env
    networks:
    - backend
    - auth

# Setup: host <-uplink-> proxy <-frontend-> services that are reachable from the client <-backend-> services that are internal-only
# There are special networks for some services only, e.g. postgres only for the postgresql, datastore reader and datastore writer
networks:
  uplink:
  frontend:
    internal: true
  backend:
    internal: true
  postgres:
    internal: true
  datastore-reader:
    internal: true
  message-bus:
    internal: true
  auth:
    internal: true

ifelse(ADMIN_SECRET_AVAILABLE, 0,secrets:
  admin:
    file: ./secrets/admin.env)
