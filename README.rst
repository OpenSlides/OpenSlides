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
<https://www.python.org/>`_ on your system. You also need build-essential
packages (``build-essential``) and header files and a static library for
Python (``python3-dev``).


b. Setup a virtual Python environment (optional)
''''''''''''''''''''''''''''''''''''''''''''''''

You can setup a virtual Python environment using the virtual environment
(venv) package for Python to install OpenSlides as non-root user.

*Note: For Ubuntu 14.04 you have to install the pyvenv binary package*
``python3.4-venv`` *before.*

*Note: For Ubuntu 16.04 you have to install the pyvenv binary package*
``python3-venv`` *before.*

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

* CACHES
* CHANNEL_LAYERS
* DATABASES
* SESSION_ENGINE

You should use a webserver like Apache HTTP Server or nginx to serve the
static and media files as proxy server in front of your OpenSlides
interface server. You also should use a database like PostgreSQL and Redis
as channels backend, cache backend and session engine. Finally you should
start some WSGI workers and one or more interface servers (Daphne or Geiss).

Please see the respective section in the `DEVELOPMENT.rst
<https://github.com/OpenSlides/OpenSlides/blob/master/DEVELOPMENT.rst>`_ and:

* https://channels.readthedocs.io/en/latest/deploying.html
* https://github.com/ostcar/geiss
* https://docs.djangoproject.com/en/1.10/topics/cache/
* https://github.com/sebleier/django-redis-cache
* https://docs.djangoproject.com/en/1.10/ref/settings/#databases


Used software
=============

OpenSlides uses the following projects or parts of them:

* Several Python packages (see ``requirements_production.txt``).

* Several JavaScript packages (see ``bower.json``)

  * `angular <http://angularjs.org>`_, License: MIT
  * `angular-animate <http://angularjs.org>`_, License: MIT
  * `angular-bootstrap-colorpicker <https://github.com/buberdds/angular-bootstrap-colorpicker>`_, License: MIT
  * `angular-chosen-localytics <http://github.com/leocaseiro/angular-chosen>`_, License: MIT
  * `angular-ckeditor <https://github.com/lemonde/angular-ckeditor>`_, License: MIT
  * `angular-file-saver <https://github.com/alferov/angular-file-saver>`_, License: MIT
  * `angular-formly <http://formly-js.github.io/angular-formly/>`_, License: MIT
  * `angular-formly-templates-bootstrap <http://formly-js.github.io/angular-formly-templates-bootstrap/>`_, License: MIT
  * `angular-gettext <http://angular-gettext.rocketeer.be/>`_, License: MIT
  * `angular-messages <http://angularjs.org>`_, License: MIT
  * `angular-pdf <http://github.com/sayanee/angularjs-pdf>`_, License: MIT
  * `angular-sanitize <http://angularjs.org>`_, License: MIT
  * `angular-scroll-glue <https://github.com/Luegg/angularjs-scroll-glue>`_, License: MIT
  * `angular-ui-bootstrap <http://angular-ui.github.io/bootstrap/>`_, License: MIT
  * `angular-ui-router <http://angular-ui.github.io/ui-router/>`_, License: MIT
  * `angular-ui-router-title <https://github.com/nonplus/angular-ui-router-title>`_, License: MIT
  * `angular-ui-tree <https://github.com/angular-ui-tree/angular-ui-tree>`_, License: MIT
  * `angular-xeditable <http://vitalets.github.io/angular-xeditable>`_, License: MIT
  * `angularjs-scroll-glue <https://github.com/Luegg/angularjs-scroll-glue>`_, License: MIT
  * `angularjs-slider <https://github.com/angular-slider/angularjs-slider>`_, License: MIT
  * `api-check <https://github.com/kentcdodds/api-check>`_, License: MIT
  * `blob-polyfill <https://github.com/bjornstar/blob-polyfill>`_, License: MIT
  * `bootstrap <http://getbootstrap.com>`_, License: MIT
  * `bootstrap <http://getbootstrap.com>`_, License: MIT
  * `bootstrap-css-only <https://getbootstrap.com/>`_, License: MIT
  * `bootstrap-css-only <http://getbootstrap.com>`_, License: MIT
  * `bootstrap-ui-datetime-picker <https://github.com/Gillardo/bootstrap-ui-datetime-picker>`_, License: MIT
  * `chosen <https://harvesthq.github.io/chosen/>`_, License: https://github.com/harvesthq/chosen/blob/master/LICENSE.md
  * `chosen-js <https://harvesthq.github.io/chosen/>`_, License: MIT
  * `ckeditor <http://ckeditor.com>`_, License: (GPL-2.0 OR LGPL-2.1 OR MPL-1.1)
  * `docxtemplater <https://github.com/open-xml-templating/docxtemplater>`_, License: MIT
  * `file-saver.js <https://github.com/Teleborder/FileSaver.js>`_, License: LICENSE.md
  * `font-awesome-bower <https://github.com/tdg5/font-awesome-bower>`_, License: MIT
  * `jquery <https://jquery.com>`_, License: MIT
  * `jquery.cookie <https://plugins.jquery.com/cookie>`_, License: MIT
  * `js-data <http://www.js-data.io>`_, License: MIT
  * `js-data-angular <https://github.com/js-data/js-data-angular>`_, License: MIT
  * `jszip <http://stuartk.com/jszip>`_, License: MIT or GPLv3
  * `lodash <https://lodash.com/>`_, License: MIT
  * `ng-dialog <https://github.com/likeastore/ngDialog>`_, License: MIT
  * `ng-file-upload <https://github.com/danialfarid/ng-file-upload>`_, License: MIT
  * `ngbootbox <https://github.com/eriktufvesson/ngBootbox>`_, License: MIT
  * `ngStorage <https://github.com/gsklee/ngStorage>`_, License: MIT
  * `papaparse <http://papaparse.com>`_, License: MIT
  * `pdfjs-dist <http://mozilla.github.io/pdf.js/>`_, License: Apache-2.0
  * `pdfmake <https://bpampuch.github.io/pdfmake>`_, License: MIT
  * `roboto-fontface <https://github.com/choffmeister/roboto-fontface-bower>`_, License: Apache-2.0


License and authors
===================

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed
under the MIT License, see ``LICENSE`` file. The authors of OpenSlides are
mentioned in the ``AUTHORS`` file.
