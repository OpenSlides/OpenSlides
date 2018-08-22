========================
 OpenSlides Development
========================

If you want to contribute to OpenSlides, have a look at `OpenSlides website
<https://openslides.org/>`_ and write us an email.


Installation and start of the development version
=================================================

1. Installation on GNU/Linux or Mac OS X
----------------------------------------

a. Check requirements
'''''''''''''''''''''

Make sure that you have installed `Python (>= 3.6) <https://www.python.org/>`_,
`Node.js (>=4.x) <https://nodejs.org/>`_, `Yarn <https://yarnpkg.com/>`_ and
`Git <http://git-scm.com/>`_ on your system. You also need build-essential
packages and header files and a static library for Python.

For Ubuntu 16.04 e. g. follow `Yarn installation instructions
<https://yarnpkg.com/en/docs/install>`_ and run::

    $ sudo apt-get install git nodejs nodejs-legacy npm build-essential python3-dev


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


d. Install dependencies
'''''''''''''''''''''''

Install all required Python packages::

    $ pip install --requirement requirements.txt

Install all Node.js and Bower packages and run several JavaScript build tasks::

    $ yarn

Optional: To enhance performance run Gulp in production mode::

    $ node_modules/.bin/gulp --production


e. Start OpenSlides
'''''''''''''''''''

Use the command-line interface::

    $ python manage.py start

See step 1. d. in the installation section in the `README.rst
<https://github.com/OpenSlides/OpenSlides/blob/master/README.rst>`_.

To get help on the command line options run::

    $ python manage.py --help

Later you might want to restart the server with one of the following commands.

To start OpenSlides with Daphne and to avoid opening new browser
windows run::

    $ python manage.py start --no-browser

When debugging something email related change the email backend to console::

    $ python manage.py start --debug-email

To start OpenSlides with Daphne run::

    $ python manage.py runserver

Use gulp watch in a second command-line interface::

    $ node_modules/.bin/gulp watch


2. Installation on Windows
--------------------------

Follow the instructions above (Installation on GNU/Linux or Mac OS X) but care
of the following variations.

To get Python download and run the latest `Python 3.7 32-bit (x86) executable
installer <https://www.python.org/downloads/windows/>`_. Note that the 32-bit
installer is required even on a 64-bit Windows system. If you use the 64-bit
installer, step d. of the instruction might fail unless you installed some
packages manually.

You have to install `MS Visual C++ 2015 build tools
<https://www.microsoft.com/en-us/download/details.aspx?id=48159>`_ before you
install the required python packages for OpenSlides (unfortunately Twisted
16.6.x needs it).

To setup and activate the virtual environment in step c. use::

    > .virtualenv\Scripts\activate.bat

All other commands are the same as for GNU/Linux and Mac OS X.


3. Running the test cases
-------------------------

a. Running server tests
'''''''''''''''''''''''

To run some server tests see `.travis.yml
<https://github.com/OpenSlides/OpenSlides/blob/master/.travis.yml>`_.


b. Running AngularJS test cases
'''''''''''''''''''''''''''''''

Run client tests by starting karma::

    $ yarn run karma

Watch for file changes and run the tests automatically after each change::

    $ yarn run karma:watch

OpenSlides in big mode
======================

In the so called big mode you should use OpenSlides with Redis, PostgreSQL and a
webserver like Apache HTTP Server or nginx as proxy server in front of your
OpenSlides interface server.


1. Install and configure PostgreSQL and Redis
---------------------------------------------

Install `PostgreSQL <https://www.postgresql.org/>`_ and `Redis
<https://redis.io/>`_. For Ubuntu 16.04 e. g. run::

    $ sudo apt-get install postgresql libpq-dev redis-server

Be sure that database and redis server is running. For Ubuntu 16.04 e. g. this
was done automatically if you used the package manager.

Then add database user and database. For Ubuntu 16.04 e. g. run::

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

To start gunicorn with uvicorn as protocol server run::

    $ export DJANGO_SETTINGS_MODULE=settings
    $ export PYTHONPATH=personal_data/var/
    $ gunicorn -w 4 -k uvicorn.workers.UvicornWorker openslides.asgi:application

This example uses 4 instances. The recommendation is to use CPU cores * 2.


4. Use Nginx (optional)
-----------------------

When using Nginx as a proxy for delivering staticfiles the performance of the setup will increase very much. For delivering staticfiles you have to collect those::

    $ python manage.py collectstatic

This is an example configuration for a single Daphne listen on port 8000::

    server {
         listen 80;
         listen [::]:80;

         server_name _;

         location ~* ^/projector.*$ {
             rewrite ^.*$ /static/templates/projector-container.html;
         }
         location ~* ^/real-projector.*$ {
             rewrite ^.*$ /static/templates/projector.html;
         }
         location ~* ^/webclient.*$ {
             rewrite ^/webclient/(site|projector).*$ /static/js/webclient-$1.js;
         }
         location /static {
             alias <your path to>/collected-static;
         }
         location ~* ^/(?!ws|wss|media|rest|views).*$ {
             rewrite ^.*$ /static/templates/index.html;
         }

         location / {
             proxy_pass http://localhost:8000;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection "upgrade";
             proxy_set_header Host $http_host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Scheme $scheme;
         }
     }
