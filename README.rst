============
 OpenSlides
============

What is OpenSlides?
===================

OpenSlides is a free, web based presentation and assembly system for
managing and projecting agenda, motions and elections of an assembly. See
https://openslides.com for more information.


Installation
============

The OpenSlides server runs everywhere where Python is running (for example on
GNU/Linux, Mac or Windows). For the OpenSlides client a current web browser is required.


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
<https://openslides.com/>`_. Download latest OpenSlides release as
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

Follow the instructions above (1. Installation on GNU/Linux or Mac OS X) but care
of the following variations.

To get Python download and run the latest `Python 3.7 32-bit (x86) executable
installer <https://www.python.org/downloads/windows/>`_. Note that the 32-bit
installer is required even on a 64-bit Windows system. If you use the 64-bit
installer, step 1c of the instruction might fail unless you installed some
packages manually.

In some cases you have to install `MS Visual C++ 2015 build tools
<https://www.microsoft.com/en-us/download/details.aspx?id=48159>`_ before you
install the required python packages for OpenSlides (unfortunately Twisted
needs it).

To setup and activate the virtual environment in step 1b use::

    > .virtualenv\Scripts\activate.bat

All other commands are the same as for GNU/Linux and Mac OS X.


3. Installation with Docker
---------------------------

The installation instruction for (1) and (2) described a way to use OpenSlides in a
'small mode' with max 10 concurrent clients. To install OpenSlides for big assemblies
('big mode') you have to setup some additional components and configurations.

The easiest way to run the OpenSlides 'big mode' environment (with PostgreSQL, Redis
and NGINX) with Docker Compose: use our docker compose suite. Follow the instruction in
the `openslides-doccker-compose Repository <https://github.com/OpenSlides/openslides-docker-compose>`_.

To install and configure all components of our 'big mode' manually you can read the
`big-mode-instruction <https://github.com/OpenSlides/OpenSlides/blob/master/DEVELOPMENT.rst#openslides-in-big-mode>`_


Configuration
=============

Please consider reading the `OpenSlides configuration
<https://github.com/OpenSlides/OpenSlides/blob/master/SETTINGS.rst>`_ page to
find out about all configurations, especially when using OpenSlides for big
assemblies.


Development
===========

To setup a development environment for OpenSlides follow the instruction of
`DEVELOPMENT.rst
<https://github.com/OpenSlides/OpenSlides/blob/master/DEVELOPMENT.rst>`_.


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
