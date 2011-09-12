Features
========

Agenda
------

- Manage agenda
- Select agenda item to display on projector
- Projector view with automatic updating on modification (the projector is running in the browser with full screen mode as 2nd monitor)
- Edit item via web interface while viewing on the projector
- Sort item via drag and drop in the agenda (sub items possible)
- Mark item as completed
- Hide item in the projector view
- Generate agenda as pdf
- Current time on the projector view

  |agenda-overview|_   |beamer-agenda-overview|_

.. |agenda-overview| image:: _static/images/t260.agenda-overview_de.png
    :alt: Tagesordnungs-Ansicht
.. _agenda-overview: _static/images/agenda-overview_de.png

.. |beamer-agenda-overview| image:: _static/images/t260.beamer-agenda-overview_de.png
    :alt: Beamer-Ansicht der Tagesordnungs
.. _beamer-agenda-overview: _static/images/beamer-agenda-overview_de.png

    
  .. image:: _static/images/agenda-new-item_de.png
    :width: 45%
    :alt: Neuen Tagesordnungseintrag anlegen
    
  .. image:: _static/images/pdf-agenda_de.png
    :width: 45%
    :alt: Tagesordnung als PDF


Applications
------------

- Create, edit and delete applications
- Support applications from other participants
- Change application status and enter voting results
- View voting results of several ballots
- Create application as agenda item
- View change history of an application
- Create application form as pdf
- Create an overview of all applications as pdf
- voting mode: Yes/No/Abstain/invalid votes and votes cast

  .. image:: _static/images/application-overview_de.png
    :width: 45%
    :alt: Antragsübersicht
    
  .. image:: _static/images/application-new_de.png
    :width: 45%
    :alt: Neuer Antrag
    
  .. image:: _static/images/application-view_de.png
    :width: 45%
    :alt: Darstellung eines Antrags mit Verwaltugsfunktion
    
  .. image:: _static/images/beamer-application-view_de.png
    :width: 45%
    :alt: Beamer-Ansicht eines einzelnen Antrags

Elections
--------

- Nominate candidates for an election from participants list and/or candidate
  myself as registered participant
- Generate a pdf ballot (with checkbox)
- Enter and display voting results
- Multiple ballots and runoff elections are supported
- Two voting modes supported: votes in favor or Yes/No/Abstain votes (dependend on number of candidates and posts), invalid votes and votes cast can be entered

Participants
-----------

- Create and manage participants (pre-defined fields: *last name, first name,  gender, group, type, committee*)
- Import of user data (in CSV format)
- configurable user groups (default include: *observer, delegate, moderation, participant management*)


General
-------

- Template for projector and web interface easily customizable via HTML and CSS
- OpenSlides is Free Software (GPL v2+ license <about.html#lizenz> `` _)
- Platform independent (runs anywhere where Pyhton is running)
- Complete German and English translations available, other languages welcome

Outlook - further development ideas for OpenSlides
--------------------------------------------------

- Fast and easy creation of a results protocol (with all agenda items, decisions, applications, electinos, polls and voting results)
- Graphical representation of the election and voting results in graphs
- Integration of graphics into agenda items
- Integration of an electronic voting system (TED / voting system)
- Integration of `deck.js <http://imakewebthings.github.com/deck.js/>`_
- ...

Are you interested in the advancement of OpenSlides? We appreciate any help!

|
About OpenSlides
================

System requirements
-------------------

- `Django 1.3+ <https://www.djangoproject.com/>`_
- `Python 2.5+ <http://python.org/>`_
- Web browser

License
-------

OpenSlides is Free Software released under the **GNU General Public License (GNU GPL)** version 2+. The software is free to use without restrictions, may be modified and that modifications may be distributed. A copy of the license is included with every release of OpenSlides and can be read also in the source code repository.

History
-------

In 2005, an internal prototype of OpenSlides was developed specifically for use on general meetings of the federal association of `protestant student community (Bundes-ESG) <http://www.bundes-esg.de>`_ in Germany by Emanuel Schütze in PHP. In late 2010 Oskar Hahn and Emanuel Schütze began with a new development in Python/Django and build up a Free Software project, called "OpenSlides". OpenSlides was published under the GPL in August 2011. Version 1.0 is planned for September 2011, then OpenSlides will be used productively at the next general meeting of the ESG in Hanover/Germany.