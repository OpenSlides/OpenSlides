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
to have these tools installed and no further dependencies (m4 may not come preinstalled on your system). If you want a simpler
setup or are interested in developing, please refer to `development
instructions <DEVELOPMENT.rst>`_.

Get OpenSlides
--------------

First, you have to clone this repository to the latest stable branch::

    git clone -b stable/3.4.x --single-branch https://github.com/OpenSlides/OpenSlides.git --recurse-submodules

**Note about migrating from version 3.3 or earlier**: With OpenSlides 3.4 submodules
and a Docker setup were introduced. If you ran into problems try to delete your
``settings.py``. If you have an old checkout you need to check out the current master
first and initialize all submodules::

    git submodule update --init

Setup Docker Compose
--------------------

You need to build the Docker images and have to setup some configuration. First,
configure HTTPS by checking the `Using HTTPS`_ section. In this section are
reasons why HTTPS is required for large deployments.

Go to ``docker`` subdirectory::

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

You can configure OpenSlides using the `.env` file. See `More settings`_. Another
hint: If you choose to deploy the default configuration, a https certificate is
needed, so make sure you have set it up beforehand.

Finally, you can start the instance using `docker-compose`:

    docker-compose up

OpenSlides is accessible on https://localhost/.

You can also use daemonized instance::

    docker-compose up -d
    docker-compose logs
    docker-compose down

Using HTTPS
-----------

The main reason (next to obviously security ones) HTTPS is required originates
from the need of HTTP/2. OpenSlides uses streaming responses to asynchronously
send data to the client. With HTTP/1.1 one TCP-Connection per request is opened.
Browsers limit the amount of concurrent connections
(`reference <https://docs.pushtechnology.com/cloud/latest/manual/html/designguide/solution/support/connection_limitations.html>`_),
so you are limited in opening tabs. HTTPS/2 just uses one connection per browser
and eliminates these restrictions. The main point to use HTTPS is that browsers
only use HTTP/2 if HTTPS is enabled.

Setting up HTTPS
""""""""""""""""

Use common providers for retrieving a certificate and private key for your
deployment. Place the certificate and private key in ``caddy/certs/cert.pem``
and ``caddy/certs/key.pem``. To use a self-signed localhost certificate, you can
execute ``caddy/make-localhost-cert.sh``.

The certificate and key are put into the docker image into ``/certs/``, so
setting up these files needs to be done before calling ``./build.sh``. When you
update the files, you must run ``./build.sh proxy`` again. If you want to have a
more flexible setup without the files in the image, you can also mount the
folder or the certificate and key into the running containers if you wish to do
so.

If both files are not present, OpenSlides will be configured to run with HTTP
only. When mounting the files make sure, that they are present during the
container startup.

Caddy, the proxy used, wants the user to persist the ``/data`` directory. If you
are going to use HTTPS add a volume in your ``docker-compose.yml`` /
``docker-stack.yml`` persisting the ``/data`` directory.

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
under the MIT License, see `LICENSE file <LICENSE>`_. The authors of OpenSlides are
mentioned in the `AUTHORS file <AUTHORS>`_.
