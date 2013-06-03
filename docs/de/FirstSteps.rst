Erste Schritte
==============

In diesem Kapitel werden die ersten Schritte bei OpenSlides erklärt.


Installation
++++++++++++

OpenSlides muss nur auf einem Computer installiert werden. Dieser fungiert im Netzwerk als Server. Im Präsentationsmodus Single gibt es kein Netzwerk. OpenSlides muss dann auf dem einen verwendeten Computer installiert werden.

Die aktuelle Version von OpenSlides, für die dieses Handbuch gültig ist, ist Version |version|.


Verwendung der Windows-Version (Portable Version mit openslides.exe)
--------------------------------------------------------------------

Laden Sie die aktuelle OpenSlides Version für Windows von
http://openslides.org herunter.  Extrahieren Sie das zip-Archiv
(z. B. ``openslides-N.N-portable.zip``) in einen beliebigen Ordner.
OpenSlides muss nun nicht weiter installiert werden. Alle notwendigen
Programmelemente sind in dem Ordner enthalten.


Verwendung der Linux/MacOS-Version
----------------------------------

Laden Sie die aktuelle OpenSlides Version für Linux/MacOS von http://openslides.org oder über den Python Package Index (PyPI) (``$ pip install openslides``) herunter. Die Installationsanleitung für diese Version finden Sie in der beiliegenden INSTALL.txt oder in der passenden Version unter http://files.openslides.org/. Folgen Sie den Anweisungen der Anleitung.


Konfiguration
+++++++++++++

Nach der Installation ist OpenSlides bereits vorkonfiguriert. Die beim ersten Start erzeugte (leere) Datenbank enthält einige Voreinstellungen. Die Konfiguration kann im laufenden Programm unter dem Tab „Konfiguration“ vorgenommen werden. Weitere Einstellungsmöglichkeiten für erfahrene Benutzer sind in der Datei ``settings.py`` möglich. Diese Datei liegt nicht im extrahierten OpenSlides Verzeichnis, sondern in einem Benutzerverzeichnis, das abhängig von Ihrem Betriebssystem ist. Unter Windows (außer bei der Portable Version) ist es standardmäßig ``$HOME\AppData\Local\openslides``, unter Linux/MacOS ist es standardmäßig ``~/.config/openslides``.


Start des Servers und Öffnen des Browsers
+++++++++++++++++++++++++++++++++++++++++

Verwendung der Windows-Version (Portable Version mit openslides.exe)
--------------------------------------------------------------------

Wenn Sie die Windows-Version (Portable Version mit openslides.exe)
verwenden, brauchen Sie nur die Datei ``openslides.exe`` auszuführen.
Mit dieser wird der Server gestartet und ihr Browser mit der richtigen
URL geöffnet.

OpenSlides kann jederzeit im schwarzen Fenster der Kommandozeile mit der Tastenkombination ``Strg`` + ``Pause`` beendet werden. Alle eingegebenen Daten bleiben in der Datenbank gespeichert.


Verwendung der Linux/MacOS-Version
----------------------------------

Starten Sie den Server, indem Sie in der Kommandozeile eingeben::

  $ openslides

Wenn Sie eine virtuelle Arbeitsumgebung (virtualenv) verwenden, müssen Sie diese zuvor aktivieren::

  $ source .venv/bin/activate

Damit wird der Server gestartet und ihr Browser mit der richtigen URL geöffnet.

OpenSlides kann jederzeit im Fenster der Kommandozeile mit der Tastenkombination ``Strg`` + ``C`` beendet werden. Alle eingegebenen Daten bleiben in der Datenbank gespeichert.

Weitere Startoptionen können Sie mit folgender Eingabe sehen::

  $ openslides --help


Öffnen des Browsers
-------------------

Bei Start des Servers wird automatisch der Browser mit der richtigen URL geöffnet.

Falls dies wegen Ihrer Browsereinstellungen nicht gelingt, rufen Sie das OpenSlides-Webinterface auf, indem Sie in die Adresszeile die IP-Adresse des Servers eintragen. Sie hat oft die Form ``http://192.168.x.y/``, wobei x und y für eine bestimmte Zahl mit ein bis drei Ziffern stehen. Am Computer, auf dem OpenSlides gestartet wurde, kann OpenSlides auch über ``http://localhost/`` aufgerufen werden. Sollten die angegebenen Adressen nicht funktionieren, versuchen Sie die Adresse, die in der Kommandozeile angegeben ist. Möglicherweise muss ``:8000`` angefügt werden.


Erster Login
------------

Der erste Login als Administrator ist mit dem Benutzernamen ``admin`` und dem Passwort ``admin`` möglich. Sie sollten das Passwort nach dem ersten Start ändern__, um Unbefugten keinen Zugriff auf Ihre Daten zu gewähren.

.. __: LoginLogout.html#

Arbeiten mit OpenSlides
+++++++++++++++++++++++

Im Webinterface von OpenSlides können Sie über die verschiedenen Menüpunkte alle Inhalte in OpenSlides eingeben und verwalten.

.. image:: ../_images/Platzhalter.png
   :class: screenshot

Im Menüpunkt „Dashboard“ steuern Sie, welche Folien auf dem Beamer angezeigt werden. Dazu klicken Sie einfach auf das jeweilige Projektorsymbol. Im Menüpunkt „Tagesordnung“ können Sie die Tagesordnung der Veranstaltung im Vorfeld anlegen, entsprechende Folien vorbereiten und die Rednerliste verwalten. In den Menüpunkten „Anträge“ und „Wahlen“ verwalten Sie die gestellten Anträge und die Wahlämter mit den Kandidaten sowie die dazugehörigen Abstimmungen und Wahlen. Der Menüpunkt „Teilnehmer/innen“ ermöglicht einen Zugriff auf die Personenprofile. Unter dem Punkt „Medien“ können Sie eigene Dateien auf den Server laden und zum Download anbieten. Im Menüpunkt „Konfiguration“ können einige Einstellungen vorgenommen werden.

Das Beamerbild ist unter der URL ``/projector/`` zu finden. Sie können auch auf dem Dashboard auf die Projektor-Live-Ansicht klicken. Loggen Sie sich an dem Computer, an dem der Beamer angeschlossen ist, in OpenSlides ein und rufen Sie den Link oder die URL auf. Legen Sie die Anzeige in einem eigenen Browserfenster auf den Beamer und projizieren Sie sie so auf die Leinwand. In vielen Browsern kann mit der Taste ``F11`` in den Vollbildmodus gewechselt werden. Im *Präsentationsmodus Single* müssen Sie die Bildschirmanzeige auf Erweiterung/erweiterter Desktop stellen und das Browserfenster mit dem Beamerbild auf den Beamer schieben.

Das Beamerbild aktualisiert sich vollkommen automatisch (Lediglich die Kopfzeile muss manuell aktualisiert werden.). Sollte die Aktualisierung auf Grund eines Fehlers, zum Beispiel einer Unterbrechung der Verbindung zum Server, aussetzen, sehen Sie auf den Folien unter der Uhrzeit eine rote Linie. Regelmäßig kann das Beamerbild an dem Computer, an dem der Beamer angeschlossen ist, mit der Taste ``F5`` zurückgesetzt werden.
