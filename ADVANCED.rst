Advanced configuration
======================

Docker Swarm Mode
-----------------

OpenSlides may also be deployed in Swarm mode. Distributing instances over
multiple nodes may increase performance and offer failure resistance.

An example configuration file, ``docker-stack.yml.m4``, is provided. Unlike
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

All important data is stored in the database. Additionally, the project
directory should be included in backups to ensure a smooth recovery.

The primary database usually runs in the ``pgnode1`` service (but see `Database
Configuration`_ above).

In some cases, it may be sufficient to generate SQL dumps with ``pg_dump``
through ``docker exec`` to create backups. However, for proper incremental
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
