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
present already - and setup this directory like a production environment using\
the `config.yml`.

Now run

    docker-compose up --build

After all services are up initial data needs to be set to be able to login.
In a different terminal run

    ./openslides initial-data

This will add the superadmin account with the password provided from
`secrets/superadmin` (default: superadmin)

Access https://localhost:8000/ as you would expect.

To clear the database run

    rm -r db-data/*
