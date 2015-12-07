============
 OpenSlides
============

I. What is OpenSlides?
======================

OpenSlides is a free web-based presentation and assembly system for
displaying and controlling of agenda, motions and elections of an assembly.
See http://openslides.org/ for more information.


II. Requirements
================

OpenSlides runs everywhere where Python is running (for example on
GNU/Linux, Mac or Windows (XP or newer)). On each client you need only an
actual webbrowser.


III. Installation
=================

Installation on GNU/Linux or Mac OS X
-------------------------------------

1. Check requirements

   Make sure that you have installed Python Programming Language 3 (>= 3.3)
   on your system. You will also need the Python development headers.

   For example for Ubuntu run::

       $ sudo apt-get install python3-dev

2. Setup a virtual environment with Virtual Python Environment builder
   (optional)

   You can setup a virtual environment to install OpenSlides as non-root
   user. Make sure that you have installed Virtual Python Environment
   builder on your system.

   For example for Ubuntu run::

       $ sudo apt-get install python-virtualenv

   Create your OpenSlides directory, change to it, setup and activate the
   virtual environment::

       $ mkdir OpenSlides
       $ cd OpenSlides
       $ virtualenv -p /usr/bin/python3 .virtualenv
       $ source .virtualenv/bin/activate

3. Install OpenSlides

   You can use the package from the `OpenSlides Website
   <http://openslides.org/download/>`_. Download latest OpenSlides release
   as compressed tar archive and run::

       $ pip install openslides-x.x.tar.gz

   OpenSlides will install all required python packages (see
   requirements_production.txt).


Installation on Windows
-----------------------

*Note: There is a portable version of OpenSlides for Windows which does not
required any install steps. If there is a reason that you can not use the
portable version you should observe the following install steps.*

1. Check requirements

   Make sure that you have installed Python Programming Language 3 (>= 3.3)
   and Setuptools on your system.

   a. Download and run the latest `Python 3.4 32-bit MSI installer
      <https://www.python.org/downloads/windows/>`_. Note
      that the 32-bit MSI installer is required even on a 64-bit Windows
      system. If you use the 64-bit MSI installer, step 3 of this
      instruction will fail unless you installed the package reportlab
      manually.

   b. Add python directories to PATH (via Control Panel > System >
      Advanced): ``";C:\\Python34;C:\\Python34\\Scripts"``. Note that the path
      can differ if you customized the install of Python in the first step.

   c. Download and run (via double click) the last `install script
      ez_setup.py for Setuptools
      <https://pypi.python.org/pypi/setuptools/#installation-instructions>`_.

2. Setup a virtual environment with Virtual Python Environment builder
   (optional)

   You can setup a virtual environment to install OpenSlides as non-root
   user. Make sure that you have installed Virtual Python Environment
   builder on your system.

   To install Virtual Python Environment builder, open command line (cmd)
   and run::

       > easy_install https://pypi.python.org/packages/source/v/virtualenv/virtualenv-12.0.5.tar.gz

   Create your OpenSlides directory, change to it, setup and activate the
   virtual environment::

       > md OpenSlides
       > cd OpenSlides
       > virtualenv .virtualenv
       > .virtualenv\Scripts\activate

3. Install OpenSlides

   You can use the package from the `OpenSlides Website
   <http://openslides.org/download/>`_. Download latest OpenSlides release
   as compressed tar archive and run::

       > easy_install openslides-x.x.tar.gz

   OpenSlides will install all required python packages (see
   requirements_production.txt).


IV. Start
=========

To start OpenSlides simply run on command line::

    openslides

If you run this command the first time, a new database and the admin account
(Username: `admin`, Password: `admin`) will be created. Please change the password
after first login!

OpenSlides will start using the integrated Tornado webserver. It will also
try to open the webinterface in your default webbrowser. The server will
try to listen on the local ip address on port 8000. That means that the server
will be available to everyone on your local network (at least for commonly used
network configurations).

If you use a virtual environment (see install instructions, step 2), do not
forget to activate the environment before restart after you have closed the
terminal.

For Unix and Mac OS X run::

    $ source .virtualenv/bin/activate

For Windows run::

    > .virtualenv\Scripts\activate

To get help on the command line options run::

    openslides --help


V. Development
==============

If you want to join us developing OpenSlides, have a look at `GitHub
<https://github.com/OpenSlides/OpenSlides/>`_ or write an email to our
`mailing list <http://openslides.org/contact/>`_.


Installation and start of the development version
-------------------------------------------------

1. Check requirements

   You need to have `Python 3 (>=3.3) <https://www.python.org/>`_, `Node.js
   (>=0.10) <https://nodejs.org/>`_ and `Git <http://git-scm.com/>`_
   installed. See also step 1 in the correspondent instruction in section
   III.

2. Get OpenSlides source code

   Clone current master version from `OpenSlides' GitHub repository
   <https://github.com/OpenSlides/OpenSlides/>`_::

       cd ...  # Go to a nice place in your filesystem.
       git clone https://github.com/OpenSlides/OpenSlides.git
       cd OpenSlides

3. Setup and activate a virtual environment with Virtual Python Environment
   builder (optional)

   Follow step 2 in the correspondent instruction in section III.

4. Install all required Python packages::

       $ pip install -r requirements.txt

5. Install all npm and bower packages

   For Unix and Mac OS X run::

       $ npm install
       $ node_modules/.bin/bower install

   For Windows run::

       > npm install
       > node_modules\.bin\bower install

6. Concat and copy all third party JavaScript and Cascading Style Sheets
   libraries

   For Unix and Mac OS X run::

       $ node_modules/.bin/gulp

   For Windows run::

       > node_modules\.bin\gulp

7. Start OpenSlides

   Use the command-line interface::

       python manage.py start

   This will create a new development directoy with settings.py and database.

   To get help on the command-line options run::

       python manage.py --help


Coding Style
------------

You can find some information on the coding style in the `OpenSlides wiki
<https://github.com/OpenSlides/OpenSlides/wiki/De%3ACode-Richtlinien-f%C3%BCr-Openslides>`_.


VI. Used software
=================

OpenSlides uses the following projects or parts of them:

* `backports-abc <https://github.com/cython/backports_abc>`_,
  License: Python Software Foundation License

* `Beautiful Soup <http://www.crummy.com/software/BeautifulSoup/>`_,
  License: MIT

* `Django <https://www.djangoproject.com>`_, License: BSD

* `Django haystack <http://haystacksearch.org>`_, License: BSD

* `Django REST framework <http://www.django-rest-framework.org>`_, License: BSD

* `html5-lib <https://github.com/html5lib/html5lib-python>`_, License: MIT

* `jsonfield <https://github.com/bradjasper/django-jsonfield/>`_, License: MIT

* `natsort <https://github.com/SethMMorton/natsort/>`_, License: MIT

* `ReportLab <http://www.reportlab.com/software/opensource/rl-toolkit/>`_,
  License: BSD

* `roman <https://pypi.python.org/pypi/roman>`_, License: Python 2.1.1

* `setuptools <https://pypi.python.org/pypi/setuptools>`_,
  License: Python Software Foundation License

* `sockjs-tornado <https://github.com/mrjoes/sockjs-tornado>`_,
  License: MIT

* `Tornado <http://www.tornadoweb.org/en/stable/>`_, License: Apache
  License v2.0

* Several JavaScript packages (see bower.json)

  * `angular <https://angularjs.org>`_, License: MIT
  * `angular-animate <https://github.com/angular/bower-angular-animate>`_, License: MIT
  * `angular-bootstrap <https://angular-ui.github.io/bootstrap>`_, License: MIT
  * `angular-ckeditor <https://github.com/lemonde/angular-ckeditor>`_, License: MIT
  * `angular-csv-import <https://github.com/cybadave/angular-csv-import>`_, License: MIT
  * `angular-formly <http://angular-formly.com/>`_, License: MIT
  * `angular-formly-templates-bootstrap <http://angular-formly.com/>`_, License: MIT
  * `angular-gettext <https://angular-gettext.rocketeer.be/>`_, License: MIT
  * `angular-loading-bar <https://chieffancypants.github.io/angular-loading-bar/>`_, License: MIT
  * `angular-messages <https://github.com/angular/bower-angular-messages>`_, License: MIT
  * `angular-sanitize <https://github.com/angular/bower-angular-sanitize>`_, License: MIT
  * `angular-scroll-glue <https://github.com/Luegg/angularjs-scroll-glue>`_, License: MIT
  * `angular-ui-router <http://angular-ui.github.io/ui-router>`_, License: MIT
  * `angular-ui-select <https://github.com/angular-ui/ui-select>`_, License: MIT
  * `angular-ui-switch <https://github.com/xpepermint/angular-ui-switch>`_, License: MIT
  * `angular-ui-tree <https://github.com/JimLiu/angular-ui-tree>`_, License: MIT
  * `api-check <https://github.com/kentcdodds/apiCheck.js>`_, License: MIT
  * `bootbox <http://bootboxjs.com/>`_, License: MIT
  * `bootstrap <http://getbootstrap.com>`_, License: MIT
  * `bootstrap-css-only <http://getbootstrap.com>`_, License: MIT
  * `ckeditor <http://ckeditor.com>`_, License: For licensing, see LICENSE.md or http://ckeditor.com/license.
  * `font-awesome-bower <https://github.com/interval-braining/font-awesome-bower>`_, License: MIT
  * `jquery <https://jquery.com>`_, License: MIT
  * `jquery.cookie <https://plugins.jquery.com/cookie>`_, License: MIT
  * `js-data <http://www.js-data.io>`_, License: MIT
  * `js-data-angular <http://www.js-data.io/docs/js-data-angular>`_, License: MIT
  * `js-data-http <http://www.js-data.io/docs/dshttpadapter>`_, License: MIT
  * `lodash <https://lodash.com/>`_, License: MIT
  * `ng-dialog <https://github.com/likeastore/ngDialog>`_, License: MIT
  * `ng-file-upload <https://github.com/danialfarid/ng-file-upload>`_, License: MIT
  * `ngBootbox <https://github.com/eriktufvesson/ngBootbox>`_, License: MIT
  * `open-sans-fontface <https://github.com/FontFaceKit/open-sans>`_, License: Apache License version 2.0
  * `roboto-condensed <https://github.com/davidcunningham/roboto-condensed>`_, License: Apache-2.0
  * `sockjs <https://github.com/sockjs/sockjs-client>`_, License: MIT


VII. License and authors
========================

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed under
the MIT License, see LICENSE file. The authors of OpenSlides are mentioned
in the AUTHORS file.
