# Installaion of OpenSlides

## How to install and start the full system

You can start OpenSlides with Docker Compose. It is also possible to use Docker
Swarm or other container orchestration systems instead of Docker Compose for
bigger setups, but this is not described here.


### Docker and Docker Compose

So for now let's use Docker Compose. Be sure you have
[Docker](https://docs.docker.com/engine/) and [Docker
Compose](https://docs.docker.com/compose/) installed and the Docker daemon is
running. If works at least with Docker version 20.10.x and Docker Compose
version 2.13.x.

Check if you have to run docker as local user or as root.

    $ docker info


### Get manage tool

Go to a nice place in your filesystem and build or
[download](https://github.com/OpenSlides/openslides-manage-service/releases) the
manage tool `openslides`.

You can also fetch it using `wget`. Don't forget to make the binary executable.

    $ wget https://github.com/OpenSlides/openslides-manage-service/releases/download/latest/openslides
    $ chmod +x openslides


### Setup instance

To setup the instance in this directory run:

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

    $ docker-compose pull
    $ docker-compose up


### Initialize database

Wait until all services are available. Then run in a second terminal in the same
directory:

    $ ./openslides initial-data

Now open https://localhost:8000, login with superuser credentials (default
username and password: `superadmin`) and have fun.


### Reach OpenSlides from outside your local machine

Normally you want OpenSlides be reachable from outside your local machine. You
have several options to achieve this:

1. Use a [custom YAML configuration
   file](#Configuration-of-the-generated-Docker-Compose-YAML-file) to change
   `host` to a public device (e. g. `0.0.0.0`). If you also want to change the
   `port`, keep in mind that port numbers less than 1024 normally need root
   privileges on Unix systems.

2. Use a proxy server like Apache HTTP Server or Nginx. In this case your proxy
   should handle SSL-encryption and you should disable OpenSlides local
   SSL-encryption (see [respective section below](#SSL-encryption)).



## Stop the server and remove the containers

To stop the server run:

    $ docker-compose stop

To remove all containers and networks run:

    $ docker-compose down

To remove the database you have to remove the content of the `db-data`
directory.



## Configuration of the generated Docker Compose YAML file

The `setup` command generates a Docker Compose YAML file (default filename:
`docker-compose.yml`) with the container configuration for all services. This
step can be configured with a (second) YAML formated setup configuration file.

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

To get the [default config](pkg/config/default-config.yml) run:

    $ ./openslides config-create-default .

So you get a file where you can see syntax and defaults and might be able to
customize the steps above.

You may at least want to customize the `SYSTEM_URL`. The variable is used to get
the correct URL in PDF or email templates.



## SSL encryption

The manage tool provides settable options for using SSL encryption, which can be
set in the [custom YAML configuration
file](#Configuration-of-the-generated-Docker-Compose-YAML-file).

If you do not use any customization, the `setup` command generates a self-signed
certificate by default.

If you want to use any other certificate you posses, just replace `cert_crt` and
`cert_key` files in the `secrets` directory before starting Docker.

If you want to disable SSL encryption, because you use OpenSlides behind your
own proxy that provides SSL encryption, just add the following line to your
YAML configuration file.

    enableLocalHTTPS: false

If you run OpenSlides behind a publicly accessible domain, you can use caddys
integrated certificate retrieval. Add the following lines to your YAML
configuration file and of course use your own domain instead of the example:

    enableAutoHTTPS: true
    services:
      proxy:
        environment:
          EXTERNAL_ADDRESS: openslides.example.com
          # Use letsencrypt staging environment for testing
          # ACME_ENDPOINT: https://acme-staging-v02.api.letsencrypt.org/directory

Do not forget to [rebuild your Docker Compose YAML
file](#Configuration-of-the-generated-Docker-Compose-YAML-file).

See [the proxy service](https://github.com/OpenSlides/OpenSlides/blob/main/proxy) for
details on provided methods for HTTPS activation.



## Email

To enable email support add the respective settings to your [custom YAML
configuration file](#Configuration-of-the-generated-Docker-Compose-YAML-file)
and do not forget to regenerate yor Docker Compose YAML file.

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
