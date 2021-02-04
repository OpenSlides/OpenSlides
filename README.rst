============
 OpenSlides
============

What is OpenSlides?
===================

OpenSlides is a free, web-based presentation and assembly system for
managing and projecting agenda, motions, and elections of assemblies. See
https://openslides.com for more information.


Installation
============

The main deployment method is using Git, Docker and Docker Compose. You only need
to have these tools installed and no further dependencies. If you want a simpler
setup or are interested in developing, please refer to `development
instructions <DEVELOPMENT.rst>`_.

Get OpenSlides
--------------

First, you have to clone this repository::

    git clone https://github.com/OpenSlides/OpenSlides.git --recurse-submodules
    cd OpenSlides/

**Note about migrating from version 3.3 or earlier**: With OpenSlides 3.4 submodules
and a Docker setup were introduced. If you ran into problems try to delete your
``settings.py``. If you have an old checkout you need to check out the current master
first and initialize all submodules::

    git submodule update --init

Setup Docker images
-------------------

You need to build the Docker images for the client and server and have to setup some
configuration.

First go to ``docker`` subdirectory::

    cd docker

Then build all images with this script::

    ./build.sh all

You must define a Django secret key in ``secrets/django.env``, for example::

    printf "DJANGO_SECRET_KEY='%s'\n" \
      "$(tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64)" > secrets/django.env

We also strongly recommend that you set a secure admin password but it is not
strictly required. If you do not set an admin password, the default login
credentials will be displayed on the login page. Setting the admin password::

    cp secrets/adminsecret.env.example secrets/adminsecret.env
    vi secrets/adminsecret.env

Afterwards, generate the configuration file::

    m4 docker-compose.yml.m4 > docker-compose.yml

Finally, you can start the instance using ``docker-compose``::

    docker-compose up

OpenSlides runs on https://localhost:8000/.

Use can also use daemonized instance::

    docker-compose up -d
    docker-compose logs
    docker-compose down


More settings
-------------

When generating the ``docker-compose.yml``, more settings can be adjusted in the
``docker/.env`` file. All changes for the backend are passed into djangos ``settings.py``.
You can find more information about most settings in the `settings documentation
<server/SETTINGS.rst>`_. To generate the ``docker-compose.yml`` use this command::

    cd docker
    ( set -a; source .env; m4 docker-compose.yml.m4 ) > docker-compose.yml

For an advanced database setup refer to the `advanced configuration 
<ADVANCED.rst>`_.


Bugs, features and development
================================

Feel free to open issues here on GitHub! Please use the right templates for
bugs and features, and use them correctly. Pull requests are also welcome. For
a general overview of the development setup refer the `development instructions
<DEVELOPMENT.rst>`_.

For security relevant issues **do not** create public issues and refer to
our `security policy <SECURITY.md>`_.


Used software
=============

OpenSlides uses the following projects or parts of them:

* several Python packages (see ``server/requirements/production.txt``)

* several JavaScript packages (see ``client/package.json``)


License and authors
===================

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed
under the MIT License, see ``LICENSE`` file. The authors of OpenSlides are
mentioned in the ``AUTHORS`` file.
