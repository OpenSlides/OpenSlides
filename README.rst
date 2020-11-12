============
 OpenSlides
============

What is OpenSlides?
===================

OpenSlides is a free, Web-based presentation and assembly system for
managing and projecting agenda, motions, and elections of assemblies. See
https://openslides.com for more information.

Installation
============

The main deployment method is using Docker and docker-compose. You only need to
have these tools installed and no further dependencies. If you want a simpler
setup or are interested in developing, please refer to `development
instructions
<https://github.com/OpenSlides/OpenSlides/blob/master/DEVELOPMENT.rst>`_.

Note: This is temporary and will be replaced with nice scripts...

First, you have to clone this repository::

    $ git clone https://github.com/OpenSlides/OpenSlides.git
    $ cd OpenSlides/docker/

You need to build the Docker images for the client and server with this
script::

    $ ./build.sh all

You must define a Django secret key in ``secrets/django.env``, for example::

    $ printf "DJANGO_SECRET_KEY='%s'\n" \
      "$(tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64)" > secrets/django.env

We also strongly recommend that you set a secure admin password but it is not
strictly required.  If you do not set an admin password, the default login
credentials will be displayed on the login page.  Setting the admin password::

    $ cp secrets/adminsecret.env.example secrets/adminsecret.env
    $ vi secrets/adminsecret.env

Afterwards, generate the configuration file::

    EXTERNAL_HTTP_PORT=8000 m4 docker-compose.yml.m4 > docker-compose.yml

Finally, you can start the instance using ``docker-compose``::

    $ docker-compose up
    $ # or:
    $ docker-compose up -d
    $ docker-compose logs
    $ # ...
    $ docker-compose down

More settings
-------------

When generating the ``docker-compose.yml``, more settings can be adjusted in the
``docker/.env`` file. All changes for the backend are passed into djangos ``settings.py``.
You can find more information about most settings `here
<https://github.com/OpenSlides/OpenSlides/blob/master/server/SETTINGS.rst>`_. To generate
the ``docker-compose.yml`` use this command::

    $ ( set -a; source .env; m4 docker-stack.yml.m4 ) > docker-stack.yml


Docker Swarm Mode
-----------------

OpenSlides may also be deployed in Swarm mode.  Distributing instances over
multiple nodes may increase performance and offer failure resistance.

An example configuration file, ``docker-stack.yml.m4``, is provided.  Unlike
the Docker Compose setup, this configuration will most likely need to be
customized, especially its placement constraints and database-related
preferences.

Before deploying an instance on Swarm, please see `Database Configuration`_ and
`Backups`_, and review your ``docker-stack.yml``


Database Configuration
----------------------

It is fairly easy to get an OpenSlides instance up an running; however, for
production setups it is strongly advised to review the database configuration.

By default, the primary database cluster will archive all WAL files in its
volume.  Regularly pruning old data is left up to the host system, i.e., you.
Alternatively, you may disable WAL archiving by setting
``PGNODE_WAL_ARCHIVING=off`` in ``.env`` before starting the instance.

The provided ``docker-stack.yml.m4`` file includes additional database
services which can act as hot standby clusters with automatic failover
functionality.  To take advantage of this setup, the database services need to
be configured with proper placement constraints.  Before relying on this setup,
please familiarize yourself with `repmgr <https://repmgr.org/>`_.


Backups
-------

All important data is stored in the database.  Additionally, the project
directory should be included in backups to ensure a smooth recovery.

The primary database usually runs in the ``pgnode1`` service (but see `Database
Configuration`_ above).
.
In some cases, it may be sufficient to generate SQL dumps with ``pg_dump``
through ``docker exec`` to create backups.  However, for proper incremental
backups, the host system can backup the cluster's data directory and WAL
archives.

The cluster's data directory is available as a volume on the host system.
Additionally, the database archives its WAL files in the same volume by
default.  This way, the host system can include the database volume in its
regular filesystem-based backup routine and create efficient database backups
suitable for point-in-time recovery.

The `former management repository
<https://github.com/OpenSlides/openslides-docker-compose/>`_ provides the
script `openslides-pg-mgr.sh` which can enable Postgres' backup mode in all
OpenSlides database containers.

In Swarm mode, the primary database cluster may get placed on a number of
nodes.  It is, therefore, crucial to restrict the placement of database
services to nodes on which appropriate backups have been configured.


Bugs, features and development
================================

Feel free to open issues here on GitHub! Please use the right templates for
bugs and features, and use them correctly. Pull requests are also welcome; for
a general overview of the development setup refer the `development instructions
<https://github.com/OpenSlides/OpenSlides/blob/master/DEVELOPMENT.rst>`_.

Used software
=============

OpenSlides uses the following projects or parts of them:

* several Python packages (see ``server/requirements/production.txt`` and
  ``server/requirements/big_mode.txt``)

* several JavaScript packages (see ``client/package.json``)

License and authors
===================

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed
under the MIT License, see ``LICENSE`` file. The authors of OpenSlides are
mentioned in the ``AUTHORS`` file.
