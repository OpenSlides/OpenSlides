============
 OpenSlides
============

What is OpenSlides?
===================

OpenSlides is a free, web based presentation and assembly system for
managing and projecting agenda, motions and elections of an assembly. See
https://openslides.org/ for more information.


Requirements
============

The OpenSlides server runs everywhere where Python is running (for example on
GNU/Linux, Mac or Windows). For the OpenSlides client a current webbrowser is required.


Installation
============

1. Installation on GNU/Linux or Mac OS X
----------------------------------------

a. Check requirements
'''''''''''''''''''''

Make sure that you have installed `Python (>= 3.6) <https://www.python.org/>`_
on your system.

Additional you need build-essential packages, header files and a static
library for Python and also the pyvenv-3 binary package for python3.

E.g. run on Debian/Ubuntu::

    $ sudo apt-get install build-essential python3-dev python3-venv


b. Setup a virtual Python environment (optional)
''''''''''''''''''''''''''''''''''''''''''''''''

You can setup a virtual Python environment using the virtual environment
(venv) package for Python to install OpenSlides as non-root user.

Create your OpenSlides directory and change to it::

    $ mkdir OpenSlides
    $ cd OpenSlides

Setup and activate the virtual environment::

    $ python3 -m venv .virtualenv
    $ source .virtualenv/bin/activate
    $ pip install --upgrade setuptools pip


c. Install OpenSlides
'''''''''''''''''''''

To install OpenSlides just run::

    $ pip install openslides

This installs the latest stable version. To install a specific (beta)
version use ``openslides==x.y``.

You can also use the package from the `OpenSlides website
<https://openslides.org/>`_. Download latest OpenSlides release as
compressed tar archive and run::

    $ pip install openslides-x.y.tar.gz

This will install all required Python packages (see
``requirements/production.txt``).


d. Start OpenSlides
'''''''''''''''''''

To start OpenSlides simply run::

    $ openslides

If you run this command the first time, a new database and the admin account
(Username: ``admin``, Password: ``admin``) will be created. Please change the
password after first login!

OpenSlides will start a webserver. It will also try to open the webinterface in
your default webbrowser. The server will try to listen on the local ip address
on port 8000. That means that the server will be available to everyone on your
local network (at least for commonly used network configurations).

If you use a virtual environment (see step b.), do not forget to activate
the environment before restart after you closed the terminal::

    $ source .virtualenv/bin/activate

To get help on the command line options run::

    $ openslides --help

You can store settings, database and other personal files in a local
subdirectory and use these files e. g. if you want to run multiple
instances of OpenSlides::

    $ openslides start --local-installation


2. Installation on Windows
--------------------------

Download the latest portable version of OpenSlides for Windows from
`OpenSlides website <https://openslides.org/>`_ which does not require any
install steps. Simply unzip the downloaded file and run ``openslides.exe``.


Development
===========

If you want to contribute to OpenSlides, have a look at `OpenSlides website
<https://openslides.org/>`_ and write us an email. There is also an
`instruction to install the development version
<https://github.com/OpenSlides/OpenSlides/blob/master/DEVELOPMENT.rst>`_.

In OpenSlides repository you find a ``Dockerfile`` but this is not for
production use. See our `Multi instance backend for OpenSlides
<https://github.com/OpenSlides/openslides-multiinstance-backend>`_ for more
information.


Installation for big assemblies
===============================

The installation steps described above install OpenSlides in a way that
does NOT support hundreds of concurrent clients. To install OpenSlides for
big assemblies some variables have to be changed in the OpenSlides settings
file (usually called settings.py).

The configuration values that have to be altered are:

* CHANNEL_LAYERS
* DATABASES
* SESSION_ENGINE
* REDIS_ADDRESS

You should use a webserver like Apache HTTP Server or nginx to serve the
static and media files as proxy server in front of your OpenSlides
interface server. You also should use a database like PostgreSQL and Redis
as channels backend, cache backend and session engine. Finally you should
use gunicorn with uvicorn as interface server.

Please see the respective section in the `DEVELOPMENT.rst
<https://github.com/OpenSlides/OpenSlides/blob/master/DEVELOPMENT.rst>`_ and:

* https://channels.readthedocs.io/en/latest/deploying.html
* https://github.com/sebleier/django-redis-cache
* https://docs.djangoproject.com/en/1.10/ref/settings/#databases


Used software
=============

OpenSlides uses the following projects or parts of them:

* Several Python packages (see ``requirements/production.txt`` and ``requirements/big_mode.txt``).

* Several JavaScript packages (see ``client/package.json``)


License and authors
===================

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed
under the MIT License, see ``LICENSE`` file. The authors of OpenSlides are
mentioned in the ``AUTHORS`` file.
