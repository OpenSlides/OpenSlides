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

OpenSlides runs everywhere where Python is running (for example on
GNU/Linux, Mac or Windows (XP or newer)). On each client you need only a
current version of a webbrowser.


Installation
============

1. Installation on GNU/Linux or Mac OS X
----------------------------------------

a. Check requirements
'''''''''''''''''''''

Make sure that you have installed `Python (>= 3.4)
<https://www.python.org/>`_ on your system.


b. Setup a virtual Python environment (optional)
''''''''''''''''''''''''''''''''''''''''''''''''

You can setup a virtual Python environment using the virtual environment
(venv) package for Python to install OpenSlides as non-root user.

*Note: For Ubuntu 14.04 you have to install the pyvenv binary package*
``python3.4-venv`` *before.*

Create your OpenSlides directory, change to it, setup and activate the
virtual environment::

    $ mkdir OpenSlides
    $ cd OpenSlides
    $ python3 -m venv .virtualenv
    $ source .virtualenv/bin/activate


c. Install OpenSlides
'''''''''''''''''''''

To install OpenSlides just run::

    $ pip install openslides

You can also use the package from the `OpenSlides website
<https://openslides.org/>`_. Download latest OpenSlides release as
compressed tar archive and run::

    $ pip install openslides-x.x.tar.gz

This will install all required Python packages (see
``requirements_production.txt``).


d. Start OpenSlides
'''''''''''''''''''

To start OpenSlides simply run::

    $ openslides

If you run this command the first time, a new database and the admin account
(Username: `admin`, Password: `admin`) will be created. Please change the
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


Installation for big assemblies
===============================

The installation steps described above install OpenSlides in a way that does
NOT support hundreds of concurrent clients. To install OpenSlides for big
assemblies some config variables have to be changed in the OpenSlides settings
file (usually called settings.py).

The configuration values that have to be altered are:

* CACHES
* CHANNEL_LAYERS
* DATABASES

Please see:

* http://channels.readthedocs.io/en/latest/deploying.html
* https://docs.djangoproject.com/en/1.10/topics/cache/
* https://github.com/sebleier/django-redis-cache
* https://docs.djangoproject.com/en/1.10/ref/settings/#databases

You should use a webserver like Apache HTTP Server or nginx to serve the static
and media files as proxy server in front of your OpenSlides server. You also
should use a database like PostgreSQL and Redis as channels backend and cache
backend.


Used software
=============

OpenSlides uses the following projects or parts of them:

* `asgiref <https://github.com/django/asgiref/>`_, License: BSD

* `Autobahn <http://autobahn.ws/python/>`_, License: MIT

* `Constantly <https://github.com/twisted/constantly>`_, License: MIT

* `daphne <https://github.com/django/daphne/>`_, License: BSD

* `Django <https://www.djangoproject.com>`_, License: BSD

* `Django Channels <https://github.com/django/channels>`_, License: BSD

* `django-jsonfield <https://github.com/bradjasper/django-jsonfield>`_,
  License: MIT

* `Django REST framework <http://www.django-rest-framework.org>`_, License:
  BSD

* `Incremental <https://github.com/hawkowl/incremental>`_, License: MIT

* `PyPDF2 <http://mstamy2.github.io/PyPDF2/>`_, License: BSD

* `roman <https://pypi.python.org/pypi/roman>`_, License: Python 2.1.1

* `setuptools <https://pypi.python.org/pypi/setuptools>`_, License: MIT

* `Six <http://pythonhosted.org/six/>`_, License: MIT

* `Twisted <https://twistedmatrix.com>`_, License: MIT

* `txaio <https://github.com/crossbario/txaio>`_, License: MIT

* `zope.interface <https://github.com/zopefoundation/zope.interface>`,
  License: ZPL 2.1

* Several JavaScript packages (see ``bower.json``)

  * `angular <http://angularjs.org>`_, License: MIT
  * `angular-animate <http://angularjs.org>`_, License: MIT
  * `angular-bootstrap <http://angular-ui.github.io/bootstrap>`_, License: MIT
  * `angular-bootstrap-colorpicker <https://github.com/buberdds/angular-bootstrap-colorpicker>`_, License: MIT
  * `angular-chosen-localytics <http://github.com/leocaseiro/angular-chosen>`_, License: MIT
  * `angular-ckeditor <https://github.com/lemonde/angular-ckeditor/>`_, License: MIT
  * `angular-formly <http://formly-js.github.io/angular-formly/>`_, License: MIT
  * `angular-formly-templates-bootstrap <https://github.com/formly-js/angular-formly-templates-bootstrap>`_, License: MIT
  * `angular-gettext <http://angular-gettext.rocketeer.be/>`_, License: MIT
  * `angular-messages <http://angularjs.org>`_, License: MIT
  * `pdfmake <https://github.com/bpampuch/pdfmake>`_, License: MIT
  * `angular-pdf <http://github.com/sayanee/angularjs-pdf>`_, License: MIT
  * `angular-sanitize <http://angularjs.org>`_, License: MIT
  * `angular-scroll-glue <https://github.com/Luegg/angularjs-scroll-glue>`_, License: MIT
  * `angular-ui-router <http://angular-ui.github.io/ui-router/>`_, License: MIT
  * `angular-ui-tree <https://github.com/angular-ui-tree/angular-ui-tree>`_, License: MIT
  * `angular-xeditable <https://github.com/vitalets/angular-xeditable>`_, License: MIT
  * `api-check <https://github.com/kentcdodds/api-check>`_, License: MIT
  * `bootstrap <http://getbootstrap.com>`_, License: MIT
  * `bootstrap-ui-datetime-picker <https://github.com/Gillardo/bootstrap-ui-datetime-picker>`_, License: MIT
  * `chosen <http://harvesthq.github.io/chosen/>`_, License: MIT
  * `ckeditor <http://ckeditor.com>`_,  License: GPL 2+, LGPL 2.1+ or MPL 1.1.
  * `font-awesome-bower <https://github.com/tdg5/font-awesome-bower>`_, License: MIT
  * `jquery <https://jquery.com>`_, License: MIT
  * `jquery.cookie <https://plugins.jquery.com/cookie>`_, License: MIT
  * `js-data <http://www.js-data.io>`_, License: MIT
  * `js-data-angular <http://www.js-data.io/docs/js-data-angular>`_, License: MIT
  * `js-data-http <http://www.js-data.io/docs/dshttpadapter>`_, License: MIT
  * `lodash <https://lodash.com/>`_, License: MIT
  * `ng-dialog <https://github.com/likeastore/ngDialog>`_, License: MIT
  * `ng-file-upload <https://github.com/danialfarid/ng-file-upload>`_, License: MIT
  * `ngStorage <https://github.com/gsklee/ngStorage>`_, License: MIT
  * `ngbootbox <https://github.com/eriktufvesson/ngBootbox>`_, License: MIT
  * `open-sans-fontface <https://github.com/FontFaceKit/open-sans>`_, License: Apache License version 2.0
  * `Papa Parse <http://papaparse.com/>`_, License: MIT
  * `pdfjs-dist <http://mozilla.github.io/pdf.js/>`_, License: Apache-2.0
  * `roboto-condensed <https://github.com/davidcunningham/roboto-condensed>`_, License: Apache 2.0


License and authors
===================

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed
under the MIT License, see ``LICENSE`` file. The authors of OpenSlides are
mentioned in the ``AUTHORS`` file.
