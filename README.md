# OpenSlides

## What is OpenSlides?

OpenSlides is a free, web based presentation and assembly system for
managing and projecting agenda, motions and elections of an assembly. See
https://openslides.com for more information.


## Using OpenSlides productively

__OpenSlides 4 (this) is currently under heavy development!__

If you are just looking to use OpenSlides in a productive manner, please refer
to the [OpenSlides 3.4 (stable)](https://github.com/OpenSlides/OpenSlides/tree/stable/3.4.x)


## Installation

### Requirements

You need [Docker](https://docs.docker.com/engine/install/) and [Docker
Compose](https://docs.docker.com/compose/install/).

### Setup OpenSlides

For a productive setup of OpenSlides get the [OpenSlides manage
tool](https://github.com/OpenSlides/openslides-manage-service/releases/tag/latest)
from GitHub and make it executable. E. g. run:

    $ wget https://github.com/OpenSlides/openslides-manage-service/releases/download/latest/openslides
    $ chmod +x openslides

Then follow the instructions outlined in the [OpenSlides Manage
Service](https://github.com/OpenSlides/openslides-manage-service).


## Development

For further information about developing OpenSlides, refer to [the development
readme](DEVELOPMENT.md).

### Architecture of OpenSlides 4

![System architecture of OpenSlides 4](https://raw.githubusercontent.com/wiki/OpenSlides/OpenSlides/OS4/img/OpenSlides4.svg)

Read more about our [concept of OpenSlides 4.0](https://github.com/OpenSlides/OpenSlides/wiki/DE%3AKonzept-OpenSlides-4).

The technical documentation about the internals, requests and functionality can
be found [in the wiki](https://github.com/OpenSlides/OpenSlides/wiki/DE%3AKonzept-OpenSlides-4).


## License and authors

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed
under the MIT License, see ``LICENSE`` file. The authors of OpenSlides are
mentioned in the ``AUTHORS`` file.
