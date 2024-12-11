# Installation of OpenSlides

## How to install and start the full system

You can start OpenSlides with Docker Compose. It is also possible to use Docker
Swarm or other container orchestration systems instead of Docker Compose for
bigger setups, but this is not described here.


### Docker and Docker Compose

So for now let's use Docker Compose. Be sure you have
[Docker](https://docs.docker.com/engine/) and [Docker
Compose](https://docs.docker.com/compose/) installed and the Docker daemon is
running. It works at least with Docker version 20.10.x and Docker Compose
version 2.13.x.

Check if you have to run docker as local user or as root. The info command
should run without errors:

    $ docker info


### Get manage tool

Go to a nice place in your filesystem and build or
[download](https://github.com/OpenSlides/openslides-manage-service/releases) the
manage tool `openslides`.

You can also fetch it using `wget`. Don't forget to make the binary executable.

    $ wget https://github.com/OpenSlides/openslides-manage-service/releases/download/latest/openslides
    $ chmod +x openslides


### Setup instance

Setup the instance in this directory:

    $ ./openslides setup .

This will give you a default setup with local self-signed SSL certificates. You
will get [a browser warning and have to care yourself about checking the
fingerprint of the
certificate](https://en.wikipedia.org/wiki/Self-signed_certificate).

[Below](#SSL-encryption) you find for more information and how to use
[caddys](proxy) integrated certificate retrieval or how to disable the proxy
expecting SSL. Disabling SSL is only feasible if you use an extra proxy in front
of OpenSlides. Keep in mind that the browser client requires a HTTPS connection
to the server. It is NOT possible to use OpenSlides without any SSL encryption
at all.

Now have a look at the `docker-compose.yml`. You can customize it if you want
but for most cases this is not recommended.


### Pull images and start services

Then run:

    $ docker compose pull
    $ docker compose up --detach

Now all services are starting. Wait until they are ready. Maybe you have to
increase the `--timeout` flag:

    $ ./openslides check-server

To be able to use OpenSlides create initial data. This includes the first
account for the `superadmin`.

    $ ./openslides initial-data

Now open https://localhost:8000, login with superuser credentials (default
username and password: `superadmin`) and have fun.


### Reach OpenSlides from outside your local machine

Normally you want OpenSlides be reachable from outside your local machine. You
have several options to achieve this:

1. Use a [custom setup configuration YAML
   file](#Configuration-of-the-generated-Docker-Compose-YAML-file) to change
   `host` to a public device (e. g. `0.0.0.0`). If you also want to change the
   `port`, keep in mind that port numbers less than 1024 normally need root
   privileges on Unix systems.

2. Use a proxy server like Apache HTTP Server or Nginx. In this case your proxy
   should handle SSL-encryption and you should disable OpenSlides local
   SSL-encryption (see [respective section below](#SSL-encryption)).



## Stop the instance and remove the containers

To stop the instance, run:

    $ docker compose stop

To remove all containers and networks, run:

    $ docker compose down

To remove also the database (and lose all your data), run:

    $ docker compose down --volumes



## Configuration of the generated Docker Compose YAML file

The `setup` command generates a Docker Compose YAML file (default filename:
`docker-compose.yml`) with the container configuration for all services. This
step can be configured with a (second) YAML formated setup configuration file.
All options in the [defaults file](https://github.com/OpenSlides/openslides-manage-service/blob/main/pkg/config/default-config.yml) can be used to configure the setup.

E. g. create a file `my-config.yml` with the following content:

    ---
    port: 9000

After you have such a file remove your Docker Compose YAML file and rerun the
`setup` command:

    $ ./openslides setup --config my-config.yml .

This way you get a Docker Compose YAML file which let OpenSlides listen on the
configured custom port.

You may also use  the `--force` flag in some cases which also resets secrets and
all other generated files. To rebuild the Docker Compose YAML file without
resetting the whole directory (including secrets) use the `config` command
instead of the `setup` command. E. g. run:

    $ ./openslides config --config my-config.yml .

This command will just rebuild your Docker Compose YAML file.

To get the [defaults](https://github.com/OpenSlides/openslides-manage-service/blob/main/pkg/config/default-config.yml) run:

    $ ./openslides config-create-default .

So you get a file where you can see syntax and defaults and might be able to
customize the steps above.


## Update to a new version

The docker images of every OpenSlides stable update are tagged as `latest`.
So for most updates pulling the new ones and re-running `up` as described [above](#Pull images and start services) suffices.
However, this can be unreliable if `docker` fails to recognize a new image in the registry.
On the other hand, it can mean services will update "by themselves" due to silently using a new image.

It is therefore recommended to pin the version explicitly in the `my-config.yml` like this:

    ---
    defaults:
      tag: 4.2.0

Note that if changes to the configuration or structure of the docker stack were
made the appropriate version of the `openslides` tool must also be refetched
from the [releases](https://github.com/OpenSlides/openslides-manage-service/releases)
of the openslides-manage-service repository to reflect these in the generated
compose file.

To update to the new version, set the new tag, regenerate the compose file and
apply the changes to the containers:

    $ ./openslides config --config my-config.yml .
    $ docker compose up --detach

Regenerating the compose file is an important step that should be done for every
update. This will ensure that all services will be provided with all necessary
resources even when the structure is changing.

Some updates include migrations that must be run on the database.
To check the current status and start migrations if necessary, run:

    $ ./openslides migrations stats
    $ ./openslides migrations finalize


### Incompatibilities

- 4.0.8
  - The environment variables `DATASTORE_DATABASE_*` were renamed to
    `DATABASE_*`. If custom values were used, this must be reflected in config
    files.
- 4.1.0
  - PostgreSQL major is updated from 11 to 15. This means postgres will
    complain about the data being incompatible
  - Before starting containers on the new version the `postgres-data` volume
    must be removed in order to restore a dump into a fresh DB running the
    new Postgres version.
  - Thus, **first dump the contents of your DB** ([Database
    backup](#database-backup))
  - To avoid losing data, please stop all containers (`docker-compose down`)
    and copy the instance directory using e.g. `cp -r OS_DIR OS_DIR-41`.\
    The following steps should be tested in the copied location first.
    1. Be sure you did dump the DB
    2. Run `docker-compose down --volumes` to stop the containers and also
       remove the `postgres-data` volume\
       **If the dump did not work for any reason you will lose all your data**.
    3. Update the tag and regenerate the compose file (see [Update to a new
       version](#update-to-a-new-version))
      - Be sure to do fetch the new binary of the `openslides` tool as described
    4. Start only `postgres` and restore the dump into the DB, which should now
       be running on version 15 (see [Database backup](#database-backup))
    5. You can now start the remaining OpenSlides services by running
       `docker-compose up --detach`
  - After successful upgrade stop the containers and repeat the steps in the
    original directory
  - If you updated without dumping beforehand and ran into postgres' error log
    you can downgrade by using the old `openslides` tool to get PostgreSQL 11
    again and then follow these steps
  - More intricate proposals exist for upgrading PostgreSQL (such as
    https://github.com/tianon/docker-postgres-upgrade) aiming at providing less
    downtime but these are not production ready and should only be pursued if
    you know specifically what you are doing.


## SSL encryption

The manage tool provides settable options for using SSL encryption, which can be
set in the [custom setup configuration YAML
file](#Configuration-of-the-generated-Docker-Compose-YAML-file).

If you do not use any customization, the `setup` command generates a self-signed
certificate by default.

If you want to use any other certificate you posses, just replace `cert_crt` and
`cert_key` files in the `secrets` directory before starting Docker.

If you want to disable SSL encryption, because you use OpenSlides behind your
own proxy that provides SSL encryption, just add the following line to your
setup configuration YAML file.

    enableLocalHTTPS: false

Note, that some commands of the manage tool require the `--no-ssl` flag when SSL encryption is disabled, e.g:

    $ ./openslides initial-data --no-ssl
    $ ./openslides create-user --no-ssl
    
To find out which commands require the `--no-ssl` flag use the commands help:

    $ ./openslides <COMMAND> -h

If you run OpenSlides behind a publicly accessible domain, you can use caddy's
integrated certificate retrieval. Add the following lines to your setup
configuration YAML file and of course use your own domain instead of the
example:

    enableLocalHTTPS: false
    enableAutoHTTPS: true
    services:
      proxy:
        environment:
          EXTERNAL_ADDRESS: openslides.example.com
          # Use letsencrypt staging environment for testing
          # ACME_ENDPOINT: https://acme-staging-v02.api.letsencrypt.org/directory

Do not forget to [rebuild your Docker Compose YAML
file](#Configuration-of-the-generated-Docker-Compose-YAML-file).

See [the proxy service](https://github.com/OpenSlides/openslides-proxy) for
details on provided methods for HTTPS activation.



## Email

To enable email support, add the respective settings to your [custom setup
configuration YAML
file](#Configuration-of-the-generated-Docker-Compose-YAML-file) and do not
forget to regenerate your Docker Compose YAML file.

    services:
      backendAction:
        environment:
          EMAIL_HOST: my.mail.example.com
          EMAIL_PORT: 465
          EMAIL_HOST_USER: username
          EMAIL_HOST_PASSWORD: password
          EMAIL_CONNECTION_SECURITY: "SSL/TLS"  # This can also be "NONE" or "STARTTLS".
          EMAIL_TIMEOUT: 5  # Timeout in seconds for blocking operations like the connection attempt.
          EMAIL_ACCEPT_SELF_SIGNED_CERTIFICATE: "false"  # Or "true" of course.
          DEFAULT_FROM_EMAIL: mail@my.mail.example.com

You have to customize all of these environment variables according to your mail
server settings. You may omit some of them if the
[defaults](https://github.com/OpenSlides/openslides-backend/blob/main/openslides_backend/action/mixins/send_email_mixin.py)
are sufficient for you.



## Database dump

To get a dump of your (PostgreSQL) database, run:

    $ docker compose exec --user postgres postgres pg_dump -U openslides --clean > dump.sql

To restore your dump, shut down your instance if it is running, start only the
postgres container and upload your dump:

    $ docker compose down
    $ docker compose up --detach postgres
    $ docker compose exec --no-TTY --user postgres postgres psql -U openslides < dump.sql

Then restart your instance:

    $ docker compose up --detach
