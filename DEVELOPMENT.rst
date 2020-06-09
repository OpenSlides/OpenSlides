========================
 OpenSlides Development
========================

This instruction helps you to setup a development environment for OpenSlides.


Installation and start of the development version
=================================================

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

See step 1. b. in the installation section in the `README.rst
<https://github.com/OpenSlides/OpenSlides/blob/master/README.rst>`_.


d. Finish the server
''''''''''''''''''''

Install all required Python packages::

    $ pip install --requirement requirements.txt

Create a settings file, run migrations and start the server::

    $ python manage.py createsettings
    $ python manage.py migrate
    $ python manage.py runserver

To get help on the command line options run::

    $ python manage.py --help

Later you might want to restart the server with one of the following commands.

To start OpenSlides with this command and to avoid opening new browser windows
run::

    $ python manage.py start --no-browser

When debugging something email related change the email backend to console::

    $ python manage.py start --debug-email


e. Debugging the server
'''''''''''''''''''''''

If you wish to have even further debugging, enable `django-extensions
<https://django-extensions.readthedocs.io/>`_ in the ``settings.py``  by adding
``django_extensions`` to the list of ``INSTALLED_PLLUGINS``. Make sure, you
install the following packages::

    $ pip install Werkzeug pyparsing pydot django-extensions

You can start the enhanced debugging-server via::

    $ python manage.py runserver_plus


f. Setup and start the client
'''''''''''''''''''''''''''''

Go in the client's directory in a second command-line interface::

    $ cd client/

Install all dependencies and start the development server::

    $ npm install
    $ npm start

Now the client is available under ``localhost:4200``.

If you want to provide the client statically, you can build it via::

    $ npm run build

The build client files are availible from the root directory in
``openslides/static`` and can be provided via NGINX.


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

You can generate an class-structure image when having `django_extensions`
enabled (see above)::

    $ python manage.py graph_models -a -g -o my_project_visualized.png


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


OpenSlides in big mode
======================

To install OpenSlides for big assemblies (in 'big mode') you have to setup some
additional components and configurations. In the 'big mode' you should use a webserver
like NGINX to serve the static and media files as proxy server in front of your OpenSlides
interface server. You should also use a database like PostgreSQL. Use Redis as channels backend,
cache backend and session engine. Finally you should use gunicorn with uvicorn as interface server.


1. Install and configure PostgreSQL and Redis
---------------------------------------------

Install `PostgreSQL <https://www.postgresql.org/>`_ and `Redis
<https://redis.io/>`_. For Ubuntu 18.04 e. g. run::

    $ sudo apt-get install postgresql libpq-dev redis-server

Be sure that database and redis server is running. For Ubuntu 18.04 e. g. this
was done automatically if you used the package manager.

Then add database user and database. For Ubuntu 18.04 e. g. run::

    $ sudo -u postgres createuser --pwprompt --createdb openslides
    $ sudo -u postgres createdb --owner=openslides openslides


2. Change OpenSlides settings
-----------------------------

Create OpenSlides settings file if it does not exist::

    $ python manage.py createsettings

Change OpenSlides settings file (usually called settings.py): Setup
`DATABASES` entry as mentioned in the settings file. Set `use_redis` to
`True`.

Populate your new database::

    $ python manage.py migrate


3. Run OpenSlides
-----------------

To start Daphne run::

    $ export DJANGO_SETTINGS_MODULE=settings
    $ export PYTHONPATH=personal_data/var/
    $ daphne -b 0.0.0.0 -p 8000 openslides.asgi:application

The last line may be interchangeable with gunicorn and uvicorn as protocol
server::

    $ gunicorn -w 4 -b 0.0.0.0:8000 -k uvicorn.workers.UvicornWorker openslides.asgi:application


4. Use NGINX (optional)
-----------------------

When using NGINX as a proxy for delivering static files the performance of the
setup will increase.

This is an example ``nginx.conf`` configuration for Daphne listing on port
8000::

    worker_processes  1;

    events {
        worker_connections  1024;
    }

    http {
        server {
            listen 80;
            server_name  localhost;

            root   $YOUR_OS_ROOT_FOLDER/openslides/static;
            index  index.html index.htm;
            include /etc/nginx/mime.types;

            client_max_body_size 100M;

            gzip on;
            gzip_min_length 1000;
            gzip_proxied expired no-cache no-store private auth;
            gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

            location / {
                try_files $uri $uri/ /index.html;
            }
            location /apps {
                proxy_pass http://localhost:8000;
            }
            location /media {
                proxy_pass http://localhost:8000;
            }
            location /rest {
                proxy_set_header Host $http_host; 
                proxy_pass http://localhost:8000;
            }
            location /ws {
                proxy_pass http://localhost:8000;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "Upgrade";
            }

        }
    }
