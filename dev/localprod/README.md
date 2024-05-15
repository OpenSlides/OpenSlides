# Local production setup

This folder allows you to use the
[manage-tool](https://github.com/OpenSlides/openslides-manage-service) to launch
the local repository state as a production setup.
The `config.yml` instructs the manage-tool to include build tags for all service
images.

## Usage

Run

    ./setup.sh

It will download the latest manage-tool (the `openslides`-executable) - if not
present already - and setup this directory like a production environment using
the `config.yml`.

Now run

    docker compose up --build

This will add the superadmin account with the password provided from
`secrets/superadmin`.

If you run into problems, they may be related to a newer docker(-compose)
version. Try running the following before running the build command again:

    export DOCKER_BUILDKIT=0
    export COMPOSE_DOCKER_CLI_BUILD=0

If this fixes the problem, consider adding it to your `.bashrc` or similar to
not have to re-export it every time.

Finally, access https://localhost:8000/ as you would expect and login with the
default username (`superadmin`) and your chosen password.

To clear the database, run

    docker compose down --volumes
