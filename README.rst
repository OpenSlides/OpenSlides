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

Note: This is temporary and will be replace with nice scripts...

First, you have to clone this repository::

    $ git clone https://github.com/OpenSlides/OpenSlides.git
    $ cd OpenSlides/docker/

You need to build the Docker images for the client and server with this
script::

    $ ./build.sh

You must define a Django secret key in ``secrets/django.env``, for example::

    $ printf "DJANGO_SECRET_KEY='%s'\n" \
      "$(tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64)" > secrets/django.env

We also strongly recommend that you set a secure admin password but it is not
strictly required.  If you do not set an admin password, the default login
credentials will be displayed on the login page.  Setting the admin password::

    $ cp secrets/admin.env.example secrets/admin.env
    $ vi secrets/admin.env

Afterwards, generate the configuration file::

    EXTERNAL_HTTP_PORT=8000 m4 docker-compose.yml.m4 > docker-compose.yml

Once the server and client have been built, you can use ``docker-compose`` as
usual (except for the ``build`` method)::

    $ docker-compose up
    $ # or:
    $ docker-compose up -d
    $ docker-compose logs
    $ # ...
    $ docker-compose down

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
