Erste Schritte
==============

In diesem Kapitel werden die ersten Schritte bei OpenSlides erklärt.


Installation
++++++++++++

OpenSlides muss auf einem Computer installiert werden. Dieser fungiert im Netzwerk als Server. Im Präsentationsmodus Single gibt es kein Netzwerk. OpenSlides muss dann auf dem einen verwendeten Computer installiert werden.


Verwendung der Windows-Version (Portable Version mit openslides.exe)
--------------------------------------------------------------------

Laden Sie die aktuelle OpenSlides Version für Windows von
http://www.openslides.org herunter.  Extrahieren Sie das zip-Archiv
(z.B. ``openslides-1.2-portable.zip``) in einen beliebigen Ordner.
OpenSlides muss nun nicht weiter installiert werden. Alle notwendigen
Programmelemente sind in dem Ordner enthalten.


Verwendung der Linux/MacOS-Version oder des Quellcodes aus dem OpenSlides-Repository
------------------------------------------------------------------------------------

Laden Sie die aktuelle OpenSlides Version für Linux/MacOS von
http://www.openslides.org herunter. Die Installationsanleitung für
diese Version finden Sie in der beiliegenden INSTALL.txt. Folgen Sie
den Anweisungen der Anleitung.



Konfiguration
+++++++++++++

Nach der Installation ist OpenSlides bereits vorkonfiguriert. Die beim ersten Start erzeugte (leere) Datenbank enthält einige Voreinstellungen. Die Konfiguration kann im laufenden Programm unter dem Tab „Konfiguration“ vorgenommen werden. Weitere Einstellungsmöglichkeiten für erfahrene Benutzer sind in den Dateien ``openslides_settings.py`` und ``settings.py`` möglich.


Start des Servers und Öffnen des Browsers
+++++++++++++++++++++++++++++++++++++++++

Verwendung der Windows-Version (Portable Version mit openslides.exe)
--------------------------------------------------------------------

Wenn Sie die Windows-Version (Portable Version mit openslides.exe) verwenden, brauchen Sie nur die Datei ``openslides.exe`` ausführen. Mit dieser wird der Server gestartet und ihr Browser mit der richtigen URL geöffnet.

OpenSlides kann jederzeit im schwarzen Fenster der Kommandozeile mit der Tastenkombination ``Strg`` + ``Pause`` beendet werden. Alle eingegebenen Daten bleiben in der Datenbank gespeichert.


Verwendung der Linux/MacOS-Version oder des Quellcodes aus dem OpenSlides-Repository
------------------------------------------------------------------------------------

Starten Sie den Server, indem Sie in der Kommandozeile in den Ordner wechseln, der die Datei ``start.py`` enthält, und eingeben::

  source .venv/bin/activate

  python start.py

Damit wird der Server gestartet und ihr Browser mit der richtigen URL geöffnet.

OpenSlides kann jederzeit im Fenster der Kommandozeile mit der Tastenkombination ``Strg`` + ``Pause`` beendet werden. Alle eingegebenen Daten bleiben in der Datenbank gespeichert.

Weitere Startoptionen können Sie mit folgender Eingabe sehen::

  python start.py --help


Öffnen des Browsers
-------------------

Bei Start des Servers wird automatisch der Browser mit der richtigen URL geöffnet.

Falls dies wegen Ihrer Browsereinstellungen nicht gelingt, rufen Sie das OpenSlides-Webinterface auf, indem Sie in die Adresszeile die IP-Adresse des Servers eintragen. Sie hat oft die Form ``http://192.168.x.y/``, wobei x und y für eine bestimmte Zahl mit ein bis drei Ziffern stehen. Am Computer, auf dem OpenSlides gestartet wurde, kann OpenSlides auch über ``http://localhost/`` aufgerufen werden. Sollten die angegebenen Adressen nicht funktionieren, versuchen Sie die Adresse, die in der Kommandozeile angegeben ist. Möglicherweise muss ``:8000`` angefügt werden.


Erster Login
------------

Der erste Login als Administrator ist mit dem Benutzernamen ``admin`` und dem Passwort ``admin`` möglich. Sie sollten das Passwort nach dem ersten Start ändern__, um Unbefugten keinen Zugriff auf Ihre Daten zu gewähren.

.. __: chapter5_1.html#

Arbeiten mit OpenSlides
+++++++++++++++++++++++

Im Webinterface von OpenSlides können Sie über die verschiedenen Tabs alle Inhalte in OpenSlides eingeben und verwalten.

.. image:: _static/images/chapter2_01.png
 :class: screenshot

Im Tab „Projektor“ steuern Sie, welche Folien auf dem Beamer angezeigt werden. Dazu klicken Sie einfach auf das jeweilige graue Beamersymbol. Im Tab „Tagesordnung“ können Sie die Tagesordnung der Veranstaltung im Vorfeld anlegen und entsprechende Folien vorbereiten. In den Tabs „Anträge“ und „Wahlen“ verwalten Sie die gestellten Anträge und die Wahlämter mit den Kandidaten sowie die dazugehörigen Abstimmungen und Wahlen. Der Tab „Teilnehmer/innen“ ermöglicht einen Zugriff auf die Personenprofile. Im Tab „Konfiguration“ können einige Einstellungen vorgenommen werden.

Das Beamerbild ist unter der URL zu finden, die auf der Startseite und im Tab „Projektor“ im Seitenmenü links als „Projektor-Ansicht“ verlinkt ist. Loggen Sie sich an dem Computer, an dem der Beamer angeschlossen ist, in OpenSlides ein und rufen Sie den Link oder die URL auf. Legen Sie die Anzeige in einem eigenen Browserfenster auf den Beamer und projizieren Sie sie so auf die Leinwand. In vielen Browsern kann mit der Taste ``F11`` in den Vollbildmodus gewechselt werden. Im *Präsentationsmodus Single* müssen Sie die Bildschirmanzeige auf Erweiterung/erweiterter Desktop stellen und das Browserfenster mit dem Beamerbild auf den Beamer schieben.

Das Beamerbild aktualisiert sich vollkommen automatisch (Lediglich die Kopfzeile muss manuell aktualisiert werden.). Sollte die Aktualisierung auf Grund eines Fehlers, zum Beispiel einer Unterbrechung der Verbindung zum Server, aussetzen, sehen Sie auf den Folien unter der Uhrzeit eine rote Linie. Regelmäßig kann das Beamerbild an dem Computer, an dem der Beamer angeschlossen ist, mit der Taste ``F5`` zurückgesetzt werden.


