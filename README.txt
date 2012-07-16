            English README file for OpenSlides
            ==================================

   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   Attention: This is a BETA version of OpenSlides.  This means, some
   functionalities might be missing or NOT WORKING CORRECTLY.

   Beta versions are intended for testing to learn about the upcoming
   version and to suggest changes. They should not be used in a
   production environment.
   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

This is OpenSlides, version 1.2-RC1 (2012-07-16).


What is OpenSlides?
===================
OpenSlides is a free, web-based presentation system for displaying and
controlling of agendas, applications and elections of an event.

See http://www.openslides.org for more information.


Getting started
===============
Simply running openslides.exe will start OpenSlides using djangos
development server. It will also try to open OpenSlides in your
default webbrowser.

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
====================
The following command line options are available:

-a, --address=ADDRESS
    Changes the address on which the server will listen for connections

-p, --port
    Changes the port on which the server will listen for connections

--syncdb
    Create/ update the database

--reset-admin
    This will reset the password of the user

Example 1: Openslides should only be accessible on this computer:
  openslides.exe -a 127.0.0.1

Example 2: Like above, but also specify the port as 8080
  openslides.exe -a 127.0.0.01 -p 8080


Supported operating systems and browsers
========================================
Operating Systems:
  Windows XP or newer (32 and 64bit) [use openslides.exe]
  MacOS X [use start.py, see INSTALL]
  GNU/Linux [use start.py, see INSTALL]

Browsers:
  Firefox 3.6+
  IE 7+
  Chrome
  Safari
