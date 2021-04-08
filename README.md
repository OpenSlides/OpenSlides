# OpenSlides

## What is OpenSlides?

OpenSlides is a free, web based presentation and assembly system for
managing and projecting agenda, motions and elections of an assembly. See
https://openslides.com for more information.

__Note: OpenSlides 4 is currently under development.__

### Architecture of OpenSlides 4

![System architecture of OpenSlides 4](docs/OpenSlides4-systemarchitecture.png)


Read more about our [concept of OpenSlides 4.0](https://github.com/OpenSlides/OpenSlides/wiki/DE%3A-Konzept-OpenSlides-4).


## Installation

NOTE: Do not use prod at the moment. It will not work. Please refer to the DEVELOPMENT.md!

Required software: Docker, docker-compose, make, git

For a non-development setup, clone this repo and run it via docker compose. The make command is a handy shortcut for this:

    $ git clone git@github.com:OpenSlides/OpenSlides.git
    $ cd OpenSlides
    $ git checkout openslides4-dev  # needed, until OS4 is released

For a development setup, refer to [the development docs](DEVELOPMENT.md)


## Productive environment

Setup the repository (may be already done)

    $ git clone git@github.com:OpenSlides/OpenSlides.git
    $ cd OpenSlides
    $ git checkout openslides4-dev
    $ git submodule update --init

Prod setup. `./build.sh` may take a while.

    $ cd docker
    $ m4 docker-compose.yml.m4 > docker-compose.yml
    $ ./build.sh
    $ ./setup-prod.sh
    $ docker-compose up

Navigate to https://localhost:8000


## Used software

OpenSlides uses the following projects or parts of them:

* Several Python packages (see TODO)
* Several JavaScript packages (see TODO)
* TODO


## License and authors

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed
under the MIT License, see ``LICENSE`` file. The authors of OpenSlides are
mentioned in the ``AUTHORS`` file.
