Erste Schritte
==============

In diesem Kapitel werden die ersten Schritte bei OpenSlides erklärt.


Installation
++++++++++++

OpenSlides muss auf einem Computer installiert werden. Dieser fungiert im Netzwerk als Server. (Im Präsentationsmodus Single gibt es kein Netzwerk und daher auch keinen Server. OpenSlides muss dann auf dem einen verwendeten Computer installiert werden.

Die Systemvoraussetzungen finden Sie hier: **TODO**

Die Installationsanleitung finden Sie hier: **TODO**

Hinweise zur technischen Ausstattung (des Servers) finden Sie hier: **TODO** (Mindestanforderungen, empfohlene Anforderungen für Teilnehmermodus mit soundsoviel Clients)


Konfiguration
+++++++++++++

Nach der Installation ist OpenSlides bereits vorkonfiguriert. Die beim ersten Start ereugte (leere) Datenbank enthält einige Musterdaten. Die Konfiguration kann im laufenden Programm unter dem Tab „Konfiguration“ vorgenommen werden. Weitere Einstellungsmöglichkeiten für erfahrene Benutzer sind in den Dateien ``openslides_settings.py`` und ``settings.py`` möglich.


Start des Servers
+++++++++++++++++

Verwendung der Windows-Version (Portable) (**TODO**)
----------------------------------------------------

Wenn Sie die Windows-Version (**TODO**) verwenden, brauchen Sie nur die ``openslides.exe`` ausführen. Mit dieser Datei wird der Server gestartet.

OpenSlides kann jederzeit mit der Tastenkombination ``Strg`` + ``Pause`` beendet werden. Alle eingegebenen Daten bleiben in der Datenbank gespeichert.

Verwendung der anderen Version (**TODO**)
-----------------------------------------

Starten Sie den Server, indem Sie in der Kommandozeile eingeben::

  python start.py

Danach wird dort angezeigt:: 

  Validating models...
  
  0 errors found
  Django version 1.4, using settings 'openslides.settings'
  Development server is running at http://192.168.x.y:80/
  Quit the server with CTRL-BREAK.

OpenSlides kann jederzeit mit der Tastenkombination ``Strg`` + ``Pause`` beendet werden. Alle eingegebenen Daten bleiben in der Datenbank gespeichert.

Im *Präsentationsmodus Single* kann man den Server auch mit folgender Eingabe gestartet werden::

  python manage.py runserver


Öffnen des Browsers
+++++++++++++++++++

OpenSlides kann nun über den Browser aufgerufen werden. In dies Adresszeile muss die IP-Adresse des Servers eingetragen werden. Sie hat oft die Form ``http://192.168.x.y/``, wobei x und y für eine bestimmte Zahl mit ein bis drei Ziffern stehen. Am Computer, auf dem OpenSlides gestartet wurde, kann OpenSlides auch über ``http://localhost/`` aufgerufen werden. OpenSlides versucht normalerweise, den Browser gleich mit der richtigen Adresse zu öffnen.

Sollten die angegebenen Adresse nicht funktionieren, versuchen Sie die Adresse, die in der Kommandozeile angegeben ist. Möglicherweise muss ``:8000`` angefügt werden.

Der Login als Administrator ist mit dem Benutzernamen und dem Passwort möglich, den Sie während der Installation eingebenen haben. (**TODO**)


Arbeiten mit OpenSlides
+++++++++++++++++++++++

Im Webinterface von OpenSlides können Sie über die verschiedenen Tabs alle Inhalte in OpenSlides eingeben und verwalten.

.. image:: _static/images/index.png

Im Tab „Beamer“ steuern Sie, welche Folien auf dem Beamer angezeigt werden. Dazu klicken Sie einfach auf den jeweiligen grauen Haken. Im Tab „Tagesordnung“ können Sie die Tagesordnung der Veranstaltung im Vorfeld anlegen und entsprechende Folien vorbereiten. In den Tabs „Anträge“ und „Wahlen“ verwalten Sie die gestellten Anträge und die Wahlämter mit den Kandidaten sowie die dazugehörigen Abstimmungen und Wahlen. Der Tab „Teilnehmer/innen“ ermöglicht einen Zugriff auf die Personenprofile. Im Tab „Konfiguration“ können einige Einstellungen vorgenommen werden.

Das Beamerbild wird unter folgender URL aufgerufen: ``http://192.168.x.y/projector/`` Loggen Sie sich an dem Computer, an dem der Beamer angeschlossen ist, in OpenSlides ein und rufen Sie die URL auf. Legen Sie die Anzeige in einem eigenen Browserfenster auf den Beamer und projizieren Sie sie so auf die Leinwand. Im *Präsentationsmodus Single* müssen Sie die Bildschirmanzeige auf Erweiterung/erweiterter Desktop stellen und das Browserfenster mit dem Beamerbild auf den Beamer schieben.

Das Beamerbild aktualisiert sich vollkommen automatisch. Sollte die Aktualisierung auf Grund eines Fehlers, zum Beispiel einer Unterbrechung der Verbindung zum Server, aussetzen, sehen Sie auf den Folien unter der Uhrzeit eine rote Linie. Regelmäßig kann das Beamerbild an dem Computer, an dem der Beamer angeschlossen ist, mit der Taste ``F5`` zurückgesetzt werden.


