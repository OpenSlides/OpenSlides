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

   Make sure that you have installed Python Programming Language 2 (>= 2.6.9)
   on your system. You will also need the Python development headers.

   For example for Ubuntu run::

       $ sudo apt-get install python-dev

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
       $ virtualenv .virtualenv
       $ source .virtualenv/bin/activate

3. Install OpenSlides

   To use the Python Package Index (PyPI) simply run::

       $ pip install openslides

   You can also use the package from the `OpenSlides Website
   <http://openslides.org/download/>`_. Download latest OpenSlides release
   as compressed tar archive and run::

       $ pip install openslides-x.x.tar.gz

   OpenSlides will install all required python packages (see
   requirements_production.txt).

   If you use Python 2.6.x, you have to add the option `--allow-external
   argparse` to the pip command::

       $ pip install --allow-external argparse openslides


Installation on Windows
-----------------------

*Note: There is a portable version of OpenSlides for Windows which does not
required any install steps. If there is a reason that you can not use the
portable version you should observe the following install steps.*

1. Check requirements

   Make sure that you have installed Python Programming Language 2 (>= 2.6.9)
   and Setuptools on your system.

   a. Download and run the `Python 32-bit MSI installer
      <http://www.python.org/ftp/python/2.7.6/python-2.7.6.msi>`_. Note
      that the 32-bit MSI installer is required even on a 64-bit Windows
      system. If you use the 64-bit MSI installer, step 3 of this
      instruction will fail unless you installed the package reportlab
      manually.

   b. Add python directories to PATH (via Control Panel > System >
      Advanced): ``";C:\\Python27;C:\\Python27\\Scripts"``. Note that the path
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

       > easy_install https://pypi.python.org/packages/source/v/virtualenv/virtualenv-1.11.6.tar.gz

   Create your OpenSlides directory, change to it, setup and activate the
   virtual environment::

       > md OpenSlides
       > cd OpenSlides
       > virtualenv .virtualenv
       > .virtualenv\Scripts\activate

3. Install OpenSlides

   To use the Python Package Index (PyPI) simply run on command line (cmd)::

       > easy_install openslides

   You can also use the package from the `OpenSlides Website
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
(Username: `admin`) will be created. Please change the password (Password:
`admin`) after first login!

OpenSlides will start using the integrated Tornado webserver. It will also
try to open the webinterface in your default webbrowser. The server will
try to listen on the local ip address on port 80 or port 8000 if you do not
have admin permissions. That means that the server will be available to
everyone on your local network (at least for commonly used network
configurations).

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

   Follow step 1 in the correspondent instruction in section III.

2. Get OpenSlides source code

   Clone current master version from `OpenSlides' GitHub repository
   <https://github.com/OpenSlides/OpenSlides>`_. This requires `Git
   <http://git-scm.com/>`_.

   For example for Ubuntu run::

       $ sudo apt-get install git
       $ git clone git://github.com/OpenSlides/OpenSlides.git
       $ cd OpenSlides

   For Windows you can use GitBash::

       > cd ...  # Go to a nice place in your filesystem.
       > git clone git://github.com/OpenSlides/OpenSlides.git
       > cd OpenSlides

3. Setup a virtual environment with Virtual Python Environment builder (optional)

   Follow step 2 in the correspondent instruction in section III.

4. Install all required python packages

   For Unix and Mac OS X run::

       $ pip install -r requirements.txt

   If you use Python 2.6.x, you have to add the option `--allow-external
   argparse` to the pip command::

       $ pip install --allow-external argparse -r requirements.txt

   For Windows run::

       > easy_install  # Insert all packages from requirements.txt and requirements_production.txt here

5. Start OpenSlides

   To start OpenSlides use the command line script::

       python manage.py create-dev-settings

       python manage.py start --settings settings.py

   To get help on the command line options run::

       python manage.py --help


Coding Style
------------

You can find some information on the coding style in the `OpenSlides wiki
<https://github.com/OpenSlides/OpenSlides/wiki/De%3ACode-Richtlinien-f%C3%BCr-Openslides>`_.


VI. Used software
=================

OpenSlides uses the following projects or parts of them:

* `backports.ssl_match_hostname <https://bitbucket.org/brandon/backports.ssl_match_hostname>`_,
  License: Python Software Foundation License

* `Beautiful Soup <http://www.crummy.com/software/BeautifulSoup/>`_,
  License: MIT

* `Bleach <https://github.com/jsocol/bleach/>`_, License: BSD

* `Bootstrap <http://getbootstrap.com/2.3.2/>`_, License: Apache
  License v2.0

* `Django <https://www.djangoproject.com>`_, License: BSD

* `Django CKEditor <https://github.com/riklaunim/django-ckeditor>`_, License: BSD

* `django-jsonfield <https://github.com/bradjasper/django-jsonfield>`_,
  License: MIT

* `Django mptt <https://github.com/django-mptt/django-mptt/>`_, License: BSD

* `Django haystack <http://haystacksearch.org>`_, License: BSD

* `natsort <https://pypi.python.org/pypi/natsort>`_, License: MIT

* `pdf.js <http://mozilla.github.io/pdf.js/>`_, License: Apache License v2.0

* `ReportLab <http://www.reportlab.com/software/opensource/rl-toolkit/>`_,
  License: BSD

* `roman <https://pypi.python.org/pypi/roman>`_, License: Python 2.1.1

* `setuptools <https://pypi.python.org/pypi/setuptools>`_,
  License: Python Software Foundation License

* `sockjs-client <https://github.com/sockjs/sockjs-client>`_,
  License: MIT

* `sockjs-tornado <https://github.com/mrjoes/sockjs-tornado>`_,
  License: MIT

* `Sphinx <http://sphinx-doc.org/>`_, License: BSD

* Sphinx extension `autoimage <https://gist.github.com/kroger/3856821/>`_,
  License: MIT

* `Sphinx Bootstrap Theme
  <http://ryan-roemer.github.io/sphinx-bootstrap-theme/>`_, License: MIT

* `Tornado <http://www.tornadoweb.org/en/stable/>`_, License: Apache
  License v2.0

* `Ubuntu TrueType Font <http://font.ubuntu.com>`_, License: Ubuntu Font
  Licence 1.0

* `Whoosh <https://bitbucket.org/mchaput/whoosh/wiki/Home/>`_, License: BSD

* `jQuery <http://www.jquery.com>`_, License: MIT

* jQuery Plugins:

  - `jQuery DataTables Plugin <http://www.datatables.net>`_, License:
    BSD/GPLv2

  - `DataTables Natural Sort Plugin <http://datatables.net/plug-ins/sorting#natrual>`_,
    License: MIT

  - `jQuery Cookie Plugin <https://github.com/carhartl/jquery-cookie/>`_,
    License: MIT

  - `jQuery Form Plugin <http://malsup.com/jquery/form/>`_, License: MIT/GPLv2

  - `jQuery Once Plugin <http://plugins.jquery.com/once/>`_, License: MIT/GPL

  - `jQuery Templating Plugin
    <https://github.com/BorisMoore/jquery-tmpl/>`_, License: MIT/GPLv2

  - `jQuery bsmSelect <https://github.com/vicb/bsmSelect/>`_, License:
    MIT/GPLv2

* `jQuery UI <http://jqueryui.com>`_ with custom ui components: core,
  widget, mouse, resizable, sortable, datepicker, slider and css theme 'smoothness',
  License: MIT

* jQuery UI AddOns:

  - `jQuery UI Nested Sortable
    <https://github.com/mjsarfatti/nestedSortable/>`_, License: MIT

  - `jQuery UI Slider Access
    <http://trentrichardson.com/examples/jQuery-SliderAccess/>`_, License:
    MIT/GPLv2

  - `jQuery UI Timepicker
    <http://trentrichardson.com/examples/timepicker/>`_, License: MIT/GPLv2


VII. License and authors
========================

OpenSlides is Free/Libre Open Source Software (FLOSS), and distributed under
the MIT License, see LICENSE file. The authors of OpenSlides are mentioned
in the AUTHORS file.
