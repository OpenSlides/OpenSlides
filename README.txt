==================================
English README file for OpenSlides
==================================

This is OpenSlides, version 1.4.0 (unreleased).


What is OpenSlides?
===================
OpenSlides is a free web-based presentation and assembly system for
displaying and controlling of agenda, motions and elections of an assembly.

See http://openslides.org for more information.


Getting started
===============
Install and start OpenSlides as described in the INSTALL.txt.

If you need help please contact the OpenSlides team on public mailing
list or read the OpenSlides manual. See http://openslides.org.


The start script of OpenSlides
==============================
Simply running
  openslides.exe (on Windows)
or
  openslides (on Linux/MacOS)

will start OpenSlides using djangos development server. It will also
try to open OpenSlides in your default webbrowser.

The server will listen on the IP address of your current hostname on
port 80 (if port 80 is not available port 8000 will be used).
This means that the server will be available to everyone on your
local network (at least for commonly used network configurations).

See `Command line options` below if you need to change this.

The login for the default admin user after (created on first start),
is as follows:

  Username: admin
  Password: admin


Command line options
--------------------
The following command line options are available:

-h, --help
    Shows all options

-a, --address=ADDRESS
    Changes the address on which the server will listen for connections

-p PORT, --port=PORT
    Changes the port on which the server will listen for connections

--syncdb
    Creates/updates database before starting the server

--reset-admin
    Resets the password to 'admin' for user 'admin'

-s SETTINGS, --settings=SETTINGS
    Sets the path to the settings file.

--no-reload
    Does not reload the development server

--version
    Show version and exit.

Example 1: Openslides should only be accessible on this computer:
  openslides -a 127.0.0.1

Example 2: Like above, but also specify the port as 8080
  openslides -a 127.0.0.01 -p 8080


Supported operating systems and browsers
========================================
Operating Systems (OpenSlides runs anywhere where Pyhton is running):
  Windows XP or newer (32 and 64bit)
  MacOS X
  GNU/Linux

Browsers:
  Firefox 3.6+
  IE 7+
  Chrome
  Safari
