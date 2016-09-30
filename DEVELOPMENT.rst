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

Make sure that you have installed `Python (>= 3.4)
<https://www.python.org/>`_, `Node.js (>=0.10) <https://nodejs.org/>`_ and
`Git <http://git-scm.com/>`_ on your system. See also step 1. a. in the
installation section in the `README.rst
<https://github.com/OpenSlides/OpenSlides/blob/master/README.rst>`_.


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

    $ pip install -r requirements.txt

Install all NPM and Bower packages and run several JavaScript build tasks::

    $ npm install

Optional: To enhance performance run Gulp in production mode::

    $ node_modules/.bin/gulp --production


e. Start OpenSlides
'''''''''''''''''''

Use the command-line interface::

    $ python manage.py start

See step 1. d. in the installation section in the `README.rst
<https://github.com/OpenSlides/OpenSlides/blob/master/README.rst>`_.

To get help on the command-line options run::

    $ python manage.py --help

Later you might want to restart the server with the following command to
avoid opening new browser windows::

    $ python manage.py runserver

Use gulp watch in a second command-line interface::

    $ node_modules/.bin/gulp watch


2. Installation on Windows
--------------------------

Follow the instructions above (Installation on GNU/Linux or Mac OS X) but
care of the following variations.

To get Python download and run the latest `Python 3.5 32-bit (x86)
executable installer <https://www.python.org/downloads/windows/>`_. Note
that the 32-bit installer is required even on a 64-bit Windows system. If
you use the 64-bit installer, step d. of the instruction will fail unless
you installed the package Reportlab manually.

You also have to install Setuptools. Download and run (via double click)
the last `install script ez_setup.py for Setuptools
<https://pypi.python.org/pypi/setuptools/#installation-instructions>`_.

To setup and activate the virtual environment in step c. use::

    > .virtualenv\Scripts\activate.bat

All other commands are the same as for GNU/Linux and Mac OS X.


3. Running the test cases
-------------------------

a. Running Angular.js test cases
''''''''''''''''''''''''''''''''

    $ node_modules/.bin/karma start tests/karma/karma.conf.js


Installation Openslides in big mode
===================================

1. Install PostgreSQL und redis:

apt-get install postgresql redis-server libpg-dev

TODO: Configure postgresql

2. Install python dependencies

pip install django-redis asgi-redis psycopg2

3. Change settings.py

(See comments in the settings)

The relevant settings are: DATABASES, CHANNEL_LAYERS, CACHES

4. Start one or more workers:

python manage.py runworker

5. Start daphne. Set the DJANGO_SETTINGS_MODULE and the PYTHONPATH

DJANGO_SETTINGS_MODULE=settings PYTHONPATH=personal_data/var/ daphne openslides.asgi:channel_layer
