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
dnl return env variable (quoted)
define(`read_env', `esyscmd(`printf "\`%s'" "$$1"')')
dnl return env variable if set; otherwise, return given alternative value
define(`ifenvelse', `ifelse(read_env(`$1'),, `$2', read_env(`$1'))')

define(`PROXY_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_PROXY_NAME', openslides-proxy):dnl
ifenvelse(`DOCKER_OPENSLIDES_PROXY_TAG', latest))
define(`BACKEND_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_BACKEND_NAME', openslides-server):dnl
ifenvelse(`DOCKER_OPENSLIDES_BACKEND_TAG', latest))
define(`FRONTEND_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_FRONTEND_NAME', openslides-client):dnl
ifenvelse(`DOCKER_OPENSLIDES_FRONTEND_TAG', latest))
define(`AUTOUPDATE_IMAGE',
ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/dnl
ifenvelse(`DOCKER_OPENSLIDES_AUTOUPDATE_NAME', openslides-autoupdate):dnl
ifenvelse(`DOCKER_OPENSLIDES_AUTOUPDATE_TAG', latest))

define(`PRIMARY_DB', `ifenvelse(`PGNODE_REPMGR_PRIMARY', pgnode1)')

define(`PGBOUNCER_NODELIST',
`ifelse(read_env(`PGNODE_2_ENABLED'), 1, `,pgnode2')`'dnl
ifelse(read_env(`PGNODE_3_ENABLED'), 1, `,pgnode3')')

define(`PROJECT_DIR', ifdef(`PROJECT_DIR',PROJECT_DIR,.))
define(`ADMIN_SECRET_AVAILABLE', `syscmd(`test -f 'PROJECT_DIR`/secrets/adminsecret.env')sysval')
define(`USER_SECRET_AVAILABLE', `syscmd(`test -f 'PROJECT_DIR`/secrets/usersecret.env')sysval')
divert(0)dnl
dnl ----------------------------------------
# This configuration was created from a template file.  Before making changes,
# please make sure that you do not have a process in place that would override
# your changes in the future.  The accompanying .env file might be the correct
# place for customizations instead.
version: '3.4'

x-osserver:
  &default-osserver
  image: BACKEND_IMAGE
  networks:
    - back
  restart: always
x-osserver-env: &default-osserver-env
    AUTOUPDATE_DELAY: ifenvelse(`AUTOUPDATE_DELAY', 1)
    DEMO_USERS: "ifenvelse(`DEMO_USERS',)"
    CONNECTION_POOL_LIMIT: ifenvelse(`CONNECTION_POOL_LIMIT', 100)
    DATABASE_HOST: "ifenvelse(`DATABASE_HOST', pgbouncer)"
    DATABASE_PASSWORD: "ifenvelse(`DATABASE_PASSWORD', openslides)"
    DATABASE_PORT: ifenvelse(`DATABASE_PORT', 5432)
    DATABASE_USER: "ifenvelse(`DATABASE_USER', openslides)"
    DEFAULT_FROM_EMAIL: "ifenvelse(`DEFAULT_FROM_EMAIL', noreply@example.com)"
    EMAIL_HOST: "ifenvelse(`EMAIL_HOST', postfix)"
    EMAIL_HOST_PASSWORD: "ifenvelse(`EMAIL_HOST_PASSWORD',)"
    EMAIL_HOST_USER: "ifenvelse(`EMAIL_HOST_USER',)"
    EMAIL_PORT: ifenvelse(`EMAIL_PORT', 25)
    EMAIL_USE_SSL: "ifenvelse(`EMAIL_USE_SSL',)"
    EMAIL_USE_TLS: "ifenvelse(`EMAIL_USE_TLS',)"
    EMAIL_TIMEOUT: "ifenvelse(`EMAIL_TIMEOUT',)"
    ENABLE_ELECTRONIC_VOTING: "ifenvelse(`ENABLE_ELECTRONIC_VOTING', False)"
    ENABLE_CHAT: "ifenvelse(`ENABLE_CHAT', False)"
    ENABLE_SAML: "ifenvelse(`ENABLE_SAML', False)"
    INSTANCE_DOMAIN: "ifenvelse(`INSTANCE_DOMAIN', http://example.com:8000)"
    JITSI_DOMAIN: "ifenvelse(`JITSI_DOMAIN',)"
    JITSI_ROOM_PASSWORD: "ifenvelse(`JITSI_ROOM_PASSWORD',)"
    JITSI_ROOM_NAME: "ifenvelse(`JITSI_ROOM_NAME',)"
    OPENSLIDES_LOG_LEVEL: "ifenvelse(`OPENSLIDES_LOG_LEVEL', INFO)"
    DJANGO_LOG_LEVEL: "ifenvelse(`DJANGO_LOG_LEVEL', INFO)"
    REDIS_HOST: "ifenvelse(`REDIS_HOST', redis)"
    REDIS_PORT: ifenvelse(`REDIS_PORT', 6379)
    REDIS_SLAVE_HOST: "ifenvelse(`REDIS_SLAVE_HOST', redis-slave)"
    REDIS_SLAVE_PORT: ifenvelse(`REDIS_SLAVE_PORT', 6379)
    SERVER_SETUP_HOST: "ifenvelse(`SERVER_SETUP_HOST', server-setup)"
    SERVER_SETUP_PORT: ifenvelse(`SERVER_SETUP_PORT', 8000)
    RESET_PASSWORD_VERBOSE_ERRORS: "ifenvelse(`RESET_PASSWORD_VERBOSE_ERRORS', False)"
x-pgnode: &default-pgnode
  image: ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/openslides-repmgr:latest
  networks:
    - dbnet
  labels:
    org.openslides.role: "postgres"
  restart: always
x-pgnode-env: &default-pgnode-env
  REPMGR_RECONNECT_ATTEMPTS: 30
  REPMGR_RECONNECT_INTERVAL: 10
  REPMGR_WAL_ARCHIVE: "ifenvelse(`PGNODE_WAL_ARCHIVING', on)"

services:
  proxy:
    image: PROXY_IMAGE
    depends_on:
      - server
      - client
      - autoupdate
      - media
    networks:
      - front
      - back
    ports:
      - "127.0.0.1:ifenvelse(`EXTERNAL_HTTP_PORT', 8000):8000"

  server:
    << : *default-osserver
    depends_on:
      - server-setup
    environment:
      << : *default-osserver-env
    secrets:
      - django
      ifelse(read_env(`ENABLE_SAML'), `True',- saml_cert
      - saml_key
      - saml_config)
    ifelse(read_env(`OPENSLIDES_BACKEND_SERVICE_REPLICAS'),,,deploy:
      replicas: ifenvelse(`OPENSLIDES_BACKEND_SERVICE_REPLICAS', 1))

  server-setup:
    << : *default-osserver
    entrypoint: /usr/local/sbin/entrypoint-db-setup
    environment:
      << : *default-osserver-env
    secrets:
      - django
      ifelse(ADMIN_SECRET_AVAILABLE, 0,- os_admin)
      ifelse(USER_SECRET_AVAILABLE, 0,- os_user)
      ifelse(read_env(`ENABLE_SAML'), `True',- saml_cert
      - saml_key
      - saml_config)
    depends_on:
      - pgbouncer
      - redis
      - redis-slave

  client:
    image: FRONTEND_IMAGE
    restart: always
    networks:
      - back

  autoupdate:
    image: AUTOUPDATE_IMAGE
    restart: always
    depends_on:
      - redis
      - server
    secrets:
      - django
    environment:
      REDIS_WRITE_HOST: redis
      MESSAGE_BUS_HOST: redis-slave
    networks:
      - back

  pgnode1:
    << : *default-pgnode
    environment:
      << : *default-pgnode-env
      REPMGR_NODE_ID: 1
      REPMGR_PRIMARY: ifelse(PRIMARY_DB, pgnode1, `# This is the primary', PRIMARY_DB)
    volumes:
      - "dbdata1:/var/lib/postgresql"
ifelse(read_env(`PGNODE_2_ENABLED'), 1, `'
  pgnode2:
    << : *default-pgnode
    environment:
      << : *default-pgnode-env
      REPMGR_NODE_ID: 2
      REPMGR_PRIMARY: ifelse(PRIMARY_DB, pgnode2, `# This is the primary', PRIMARY_DB)
    volumes:
      - "dbdata2:/var/lib/postgresql")
ifelse(read_env(`PGNODE_3_ENABLED'), 1, `'
  pgnode3:
    << : *default-pgnode
    environment:
      << : *default-pgnode-env
      REPMGR_NODE_ID: 3
      REPMGR_PRIMARY: ifelse(PRIMARY_DB, pgnode3, `# This is the primary', PRIMARY_DB)
    volumes:
      - "dbdata3:/var/lib/postgresql")

  pgbouncer:
    environment:
      - PG_NODE_LIST=pgnode1`'PGBOUNCER_NODELIST
    image: ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/openslides-pgbouncer:latest
    restart: always
    networks:
      back:
        aliases:
          - db
          - postgres
      dbnet:
  postfix:
    image: ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/openslides-postfix:latest
    restart: always
    environment:
      MYHOSTNAME: "ifenvelse(`POSTFIX_MYHOSTNAME', localhost)"
      RELAYHOST: "ifenvelse(`POSTFIX_RELAYHOST', localhost)"
    networks:
      - back
  redis:
    image: redis:alpine
    restart: always
    networks:
      - back
  redis-slave:
    image: redis:alpine
    restart: always
    command: ["redis-server", "--save", "", "--slaveof", "redis", "6379"]
    depends_on:
      - redis
    networks:
      - back
    ifelse(read_env(`REDIS_RO_SERVICE_REPLICAS'),,,deploy:
      replicas: ifenvelse(`REDIS_RO_SERVICE_REPLICAS', 1))
  media:
    image: ifenvelse(`DEFAULT_DOCKER_REGISTRY', openslides)/openslides-media:latest
    environment:
      - CHECK_REQUEST_URL=server:8000/check-media/
      - CACHE_SIZE=ifenvelse(`CACHE_SIZE', 10)
      - CACHE_DATA_MIN_SIZE_KB=ifenvelse(`CACHE_DATA_MIN_SIZE_KB', 0)
      - CACHE_DATA_MAX_SIZE_KB=ifenvelse(`CACHE_DATA_MAX_SIZE_KB', 10240)
    restart: always
    networks:
      - back
    # Override command to run more workers per task
    # command: ["gunicorn", "-w", "4", "--preload", "-b",
    #   "0.0.0.0:8000", "src.mediaserver:app"]

volumes:
  dbdata1:
ifelse(read_env(`PGNODE_2_ENABLED'), 1, `  dbdata2:')
ifelse(read_env(`PGNODE_3_ENABLED'), 1, `  dbdata3:')

networks:
  front:
  back:
  dbnet:

secrets:
  django:
    file: ./secrets/django.env
  ifelse(ADMIN_SECRET_AVAILABLE, 0,os_admin:
    file: ./secrets/adminsecret.env)
  ifelse(USER_SECRET_AVAILABLE, 0,os_user:
    file: ./secrets/usersecret.env)
  ifelse(read_env(`ENABLE_SAML'), `True', saml_cert:
    file: ./secrets/saml/sp.crt
  saml_key:
    file: ./secrets/saml/sp.key
  saml_config:
    file: ./secrets/saml/saml_settings.json)

# vim: set sw=2 et:
