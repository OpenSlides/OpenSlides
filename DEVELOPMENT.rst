========================
 OpenSlides Development
========================

This instruction helps you to setup a development environment for OpenSlides. A
simple dev setup will be configured without the need of the docker-compose
setup. There are only the server running without a cache and a sqlite database
and the client as an development server.


1. Installation on GNU/Linux or Mac OS X
----------------------------------------

a. Check requirements
'''''''''''''''''''''

Make sure that you have installed `Python (>= 3.6) <https://www.python.org/>`_,
`Node.js (>=10.x) <https://nodejs.org/>`_ and `Git <http://git-scm.com/>`_ on
your system. You also need build-essential packages and header files and a
static library for Python.

For Debian based systems (Ubuntu, etc) run::

    $ sudo apt-get install git nodejs npm build-essential python3-dev


b. Get OpenSlides source code
'''''''''''''''''''''''''''''

Clone current master version from `OpenSlides GitHub repository
<https://github.com/OpenSlides/OpenSlides/>`_::

    $ git clone https://github.com/OpenSlides/OpenSlides.git
    $ cd OpenSlides


c. Setup a virtual Python environment (optional)
''''''''''''''''''''''''''''''''''''''''''''''''

You can setup a virtual Python environment using the virtual environment
(venv) package for Python to install OpenSlides as non-root user. This will
allow for encapsulated dependencies. They will be installed in the virtual
environment and not globally on your system.

Setup and activate the virtual environment::

    $ python3 -m venv .virtualenv
    $ source .virtualenv/bin/activate

You can exit the environment with::

    $ deactivate

d. Server
'''''''''

Go into the server's directory::

    $ cd server/

Install all required Python packages::

    $ pip install --upgrade setuptools pip
    $ pip install --requirement requirements.txt

Create a settings file, run migrations and start the server::

    $ python manage.py createsettings
    $ python manage.py migrate
    $ python manage.py runserver

All you data (database, config, mediafiles) are stored in ``personal_data/var``.
To get help on the command line options run::

    $ python manage.py --help

Later you might want to restart the server with one of the following commands.

To run the OpenSlides server execute::

    $ python manage.py runserver

When debugging something email related change the email backend to console::

    $ python manage.py runserver --debug-email

The server is available under http://localhost:8000. Especially the rest interface
might be important during development: http://localhost:8000/rest/ (The trailing
slash is important!).

e. Client
'''''''''

Go in the client's directory::

    $ cd client/

Install all dependencies and start the development server::

    $ npm install
    $ npm start

After a while, the client is available under http://localhost:4200.


2. Installation on Windows
--------------------------

Follow the instructions above (Installation on GNU/Linux or Mac OS X) but care
of the following variations.

To get Python download and run the latest `Python 3.7 32-bit (x86) executable
installer <https://www.python.org/downloads/windows/>`_. Note that the 32-bit
installer is required even on a 64-bit Windows system. If you use the 64-bit
installer, step d. of the instruction might fail unless you installed some
packages manually.

In some cases you have to install `MS Visual C++ 2015 build tools
<https://www.microsoft.com/en-us/download/details.aspx?id=48159>`_ before you
install the required python packages for OpenSlides (unfortunately Twisted
needs it).

To setup and activate the virtual environment in step c. use::

    > .virtualenv\Scripts\activate.bat

All other commands are the same as for GNU/Linux and Mac OS X.


3. Running the test cases
-------------------------

a. Running server tests
'''''''''''''''''''''''

To run some server tests see `.travis.yml
<https://github.com/OpenSlides/OpenSlides/blob/master/.travis.yml>`_.

b. Client tests and commands
''''''''''''''''''''''''''''

Change to the client's directory to run every client related command. Run
client tests::

    $ npm test

Fix the code format and lint it with::

    $ npm run prettify-write
    $ npm run lint

To extract translations run::

    $ npm run extract

When updating, adding or changing used packages from npm, please update the
README.md using following command::

    $ npm run licenses


4. Notes for running OpenSlides in larger setups
------------------------------------------------

For productive setups refer to the docker-compose setup described in the main
`README <https://github.com/OpenSlides/OpenSlides/blob/master/README.rst>`_.

While develpment it might be handy to use a cache and another database.
PostgreSQL is recommended and Redis necessary as a cache. Both can be set up in
the ``settings.py``. Please consider reading the `OpenSlides configuration
<https://github.com/OpenSlides/OpenSlides/blob/master/server/SETTINGS.rst>`_ page
to find out about all configurations, especially when using OpenSlides for big
assemblies.

If you followed the instructions and installed the pip requirements form the
``requirements.py`` all needed dependencies for another worker are installed.
Instead of running ``python manage.py runserver`` you can use daphne or gunicorn
(the latter is used in the prod setup)::

    $ export DJANGO_SETTINGS_MODULE=settings
    $ export PYTHONPATH=personal_data/var/
    $ daphne -b 0.0.0.0 -p 8000 openslides.asgi:application

The last line may be interchangeable with gunicorn and uvicorn as protocol
server::

    $ gunicorn -w 4 -b 0.0.0.0:8000 -k uvicorn.workers.UvicornWorker openslides.asgi:application

