Funktionen
==========

Tagesordnung
------------

- Tagesordnung verwalten
- Eintrag auswählen - zur Anzeige am Beamer
- Eintrag bearbeiten - während der Anzeige am Beamer
- Beamer-Ansicht mit automatischer Aktualisierung bei Änderung 
  (der Beamer läuft im Browser mit Vollbildmodus, z.B. als 2. Monitor)
- Einträge sortieren - per Drag&Drop in der Tagesordnung (Unterpunkte möglich)
- Eintrag markieren - als erledigt und versteckt
- Tagesordnung als pdf erzeugen
- aktuelle Uhrzeit auf der Beameransicht

  |agenda-overview|_  |agenda-projector|_ 
  |agenda-new|_  |agenda-pdf|_
  
.. |agenda-overview| image:: _static/images/t260.agenda-overview_de.png
    :alt: Tagesordnungs-Ansicht
.. _agenda-overview: _static/images/agenda-overview_de.png

.. |agenda-projector| image:: _static/images/t260.agenda-projector_de.png
    :alt: Beamer-Ansicht der Tagesordnung
.. _agenda-projector: _static/images/agenda-projector_de.png

.. |agenda-new| image:: _static/images/t260.agenda-new_de.png
    :alt: Neuen Tagesordnungseintrag anlegen
.. _agenda-new: _static/images/agenda-new_de.png

.. |agenda-pdf| image:: _static/images/t260.agenda-pdf_de.png
    :alt: Tagesordnung als PDF
.. _agenda-pdf: _static/images/agenda-pdf_de.png



Anträge
-------

- Anträge verwalten
- Anträge von anderen Teilnehmern unterstützen lassen
- Antragsstatus ändern
- Abstimmungsergebnisse eingeben und darstellen - mehreren Abstimmungsvorgänge möglich (Abstimmungsmodus: Ja/Nein/Enthaltung sowie ungültige und abgegebene Stimmen)
- Antrag als Tagesordnungseintrag anlegen und anzeigen
- Versionshistorie eines Antrags anzeigen
- Alle Änderungen eines Antrags (Text, Status, Unterstützer etc.) werden protokolliert
- Antragsformular als pdf erzeugen
- Übersicht aller Anträge als pdf
- Abstimmungsmodus: Ja/Nein/Enthaltungs-Stimmen sowie ungültige und abgegebene Stimmen

  |application-overview|_  |application-pdf|_
  |application-view|_  |application-projector|_
  
.. |application-overview| image::   _static/images/t260.application-overview_de.png
    :alt: Übersicht aller Anträge
.. _application-overview: _static/images/application-overview_de.png

.. |application-pdf| image:: _static/images/t260.application-pdf_de.png
    :alt: Antrag als PDF
.. _application-pdf: _static/images/application-pdf_de.png

.. |application-view| image:: _static/images/t260.application-view_de.png
    :alt: Darstellung eines Antrags
.. _application-view: _static/images/application-view_de.png

.. |application-projector| image:: _static/images/t260.application-projector_de.png
    :alt: Beamer-Ansicht eines Antrags
.. _application-projector: _static/images/application-projector_de.png



Wahlen
------

- Kandidaten aus Teilnehmerliste für eine Wahl vorschlagen (bzw. als angemeldeter Teilnehmer selbst kandidieren)
- Wahlschein als pdf generieren (mit Ankreuzfeld)
- Wahlergebenisse eingeben und darstellen
- mehrere Wahlgänge und Stichwahlen werden unterstützt
- Abstimmungsmodus: Ja-Stimmen oder Ja/Nein/Enthaltungs-Stimmen (abhängig von der Anzahl der Kandiaten und Posten), ungültige und abgegebene Stimmen können eingegeben werden

  |election-overview|_  |election-view|_
  |election-pollview|_  |election-ballot-pdf|_
  
.. |election-overview| image:: _static/images/t260.election-overview_de.png
    :alt: Übersicht aller Wahlen
.. _election-overview: _static/images/election-overview_de.png

.. |election-view| image:: _static/images/t260.election-view_de.png
    :alt: Darstellung einer Wahl
.. _election-view: _static/images/election-view_de.png

.. |election-pollview| image:: _static/images/t260.election-pollview_de.png
    :alt: Eingabe der Wahlergebnisse
.. _election-pollview: _static/images/election-pollview_de.png

.. |election-ballot-pdf| image:: _static/images/t260.election-ballot-pdf_de.png
    :alt: Wahlschein als PDF
.. _election-ballot-pdf: _static/images/election-ballot-pdf_de.png


Teilnehmer
----------

- Teilnehmer anlegen und verwalten (vordefinierte Felder: *Name, Vorname,  Geschlecht, Gruppe, Typ, Amt*)
- importieren von Teilnehmerdaten (im CSV-Format)
- Benutzergruppe frei konfigurierbar (voreingestellt sind: *Beobachter,  Delegierte, Tagesleitung, Teilnehmerverwaltung*)


Allgemein
---------

- Template für Beamer und Webinterface leicht per HTML und CSS anpassbar
- OpenSlides ist Freie Software (`GPL v2+ Lizenz <about.html#lizenz>`_)
- Plattformunabhängig (läuft überall dort, wo Pyhton läuft)
- vollständige deutsche und englische Übersetzung vorhanden, weitere Sprachen willkommen


Ausblick -- Weiterentwicklungsideen für OpenSlides:
---------------------------------------------------

- schnelle und einfache Erstellung eines Ergebnisprotokolls (mit allen Tagesordnungseinträgen, Beschlüssen, Anträgen, Abstimmungen und Wahlergbnissen)
- grafische Darstellung der Wahl- und Abstimmungsergebnisse in Diagrammen
- Einbindung von Grafiken in Tagesordnungseinträge
- Anbindung eines elektronischen Abstimmungssystems (TED/Voting-System)

Hast Du Interesse an der Weiterentwicklung von OpenSlides? Wir freuen uns über jede Mithilfe!

|
Über OpenSlides
===============

Systemanforderungen
-------------------

- `Django 1.3+ <https://www.djangoproject.com/>`_
- `Python 2.5+ <http://python.org/>`_
- Webbrowser

Lizenz
------
OpenSlides ist Freie Software und steht unter der **GNU General Public License (GNU GPL)** Version 2+. Die Software darf ohne Restriktionen benutzt, verändert und (geändert) weitergegeben werden.
Eine Kopie der Lizenz liegt jedem OpenSlides-Release bei und ist auch im Quellcode-Repository nachzulesen.

Historie
--------

Im Jahre 2005 wurde ein interner Prototyp von OpenSlides speziell für den Einsatz auf den Bundesversammlungen des Bundesverbandes der `Evangelischen StudentInnengemeinde (Bundes-ESG) <http://www.bundes-esg.de>`_ durch Emanuel Schütze in PHP entwickelt. Ende 2010 begannen Oskar Hahn und Emanuel Schütze mit einer kompletten Neuentwicklung in Python/Django und bauten ein Freies Software Projekt mit dem Namen "OpenSlides" auf. OpenSlides wurde im August 2011 unter der GPL veröffentlicht. Version 1.0 ist für September 2011 geplant, wo OpenSlides dann auch auf der nächsten ESG-Bundesversammlung in Hannover produktiv zum Einsatz kommen wird.

