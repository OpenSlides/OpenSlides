Funktionen
==========

Tagesordnung
------------

- Tagesordnung verwalten
- Eintrag auswählen zur Anzeige am Beamer
- Beamer-Ansicht mit automatischer Aktualisierung bei Änderung (der Beamer läuft z.B. im Browser mit Vollbildmodus als 2. Monitor)
- Eintrag während der Anzeige am Beamer im Webinterface bearbeiten
- Eintrag per Drag&Drop in der Tagesordnung sortieren (Unterpunkte möglich)
- Eintrag als erledigt markieren
- Eintrag auf der Beamer-Ansicht verstecken
- Tagesordnung als pdf erzeugen
- aktuelle Uhrzeit auf der Beameransicht

  .. image:: _static/images/agenda-overview_de.png
    :width: 45%
    :alt: Tagesordnungs-Ansicht
        
  .. image:: _static/images/beamer-agenda_de.png
    :width: 45%
    :alt: Beamer-Ansicht
    
  .. image:: _static/images/agenda-new-item_de.png
    :width: 45%
    :alt: Neuen Tagesordnungseintrag anlegen
    
  .. image:: _static/images/pdf-agenda_de.png
    :width: 45%
    :alt: Tagesordnung als PDF


Anträge
-------

- Anträge anlegen, bearbeiten, löschen
- Anträge von anderen Teilnehmern unterstützen lassen
- Antragsstatus ändern und Abstimmungsergebnisse eingeben
- Abstimmungsergebenisse aus mehreren Wahlgängen darstellen
- Antrag als Tagesordnungseintrag anlegen und anzeigen
- Änderungshistorie eines Antrags anzeigen
- Antragsformular als pdf erzeugen
- Übersicht aller Anträge als pdf

  .. image:: _static/images/application-overview_de.png
    :width: 45%
    :alt: Antragsübersicht
    
  .. image:: _static/images/application-overview-beamer_de.png
    :width: 45%
    :alt: Beamer-Ansicht Antragsübersicht
    
  .. image:: _static/images/application-view_de.png
    :width: 45%
    :alt: Darstellung eines Antrags mit Verwaltugsfunktion
    
  .. image:: _static/images/application-view-beamer_de.png
    :width: 45%
    :alt: Beamer-Ansicht eines einzelnen Antrags
    
Wahlen
------

- Kandidaten aus Teilnehmerliste für eine Wahl vorschlagen (bzw. als angemeldeter Teilnehmer selbst kandidieren)
- Wahlschein als pdf generieren (mit Ankreuzfeld)
- Wahlergebenisse eingeben und darstellen
- mehrere Wahlgänge und Stichwahlen werden unterstützt


Abstimmungen
------------

- Abstimmungen verwalten (als Ergänzung zu Anträgen und Wahlen)
- Ergebnisse eingeben und darstellen (analog zu Anträgen und Wahlen)
- Abstimmungsmodus: entweder nur Ja-Stimmen oder Ja/Nein/Enthaltungs-Stimmen wählbar
- ungültige und abgegebene Stimmen können eingegeben werden


Teilnehmer
----------

- Teilnehmer anlegen und verwalten (vordefinierte Felder: *Name, Vorname, E-Mail, Geschlecht, Gruppe, Typ, Amt*)
- importieren von Teilnehmerdaten (im CSV-Format)
- Benutzergruppe frei konfigurierbar (voreingestellt u.a.: *Präsidium, Tagesleitung, Delegierter, Beobachter, Gast*)

Allgemein
---------

- Template für Beamer und Webinterface leicht per HTML und CSS anpassbar
- OpenSlides ist Freie Software (`GPL v2+ Lizenz <about.html#lizenz>`_)
- Plattformunabhängig (läuft überall dort, wo Pyhton läuft)
- vollständige deutsche und englische Übersetzung vorhanden, weitere Sprachen möglich


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

