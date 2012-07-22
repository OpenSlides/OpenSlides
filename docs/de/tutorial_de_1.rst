Einrichtung von OpenSlides
==========================

Zunächst müssen Sie OpenSlides auf dem Server installieren, den Server starten und einige Einstellungen für Ihre Veranstaltung vornehmen. Danach können Sie Ihre ersten Folien einrichten und auf dem Beamer zeigen.


Installation und Start des Servers
----------------------------------

Installieren Sie OpenSlides wie hier__ beschrieben. Starten Sie den Server wie hier__ beschrieben. Sie sehen jetzt die Login-Seite von OpenSlides in Ihrem Browser. Loggen Sie sich als Administrator ein, indem Sie als Benutzernamen ``admin`` und als Passwort ``admin`` eingeben und auf ``Anmelden`` klicken.

.. image:: _static/images/tutorial_de_1_01.png
 :class: screenshot

Anschließend sollten Sie sofort das Administrator-Passwort ändern. Geben Sie in die entsprechenden Felder Ihr altes Passwort ``admin`` und als neues Passwort ``geheim`` ein. Wiederholen Sie das neue Passwort im dritten Formularfeld. Bestätigen Sie die Eingabe mit ``Speichern``.

.. image:: _static/images/tutorial_de_1_02.png
 :class: screenshot

.. __: chapter2.html#installation
.. __: chapter2.html#start-des-servers-und-offnen-des-browsers


Konfiguration des Systems
-------------------------

Geben Sie die Rahmendaten Ihrer Veranstaltung ins System ein. Wechseln Sie dazu zum Tab „Konfiguration“ und geben Sie die Allgemeinen Einstellungen wie folgt ein:

Veranstaltungsname:
  Schreberverein Nord e. V.

Kurzbeschreibung der Veranstaltung:
  Mitgliederversammlung des Vereins 2012

Veranstaltungszeitraum:
  Sonnabend, 3. März 2012

Veranstaltungsort:
  Leipzig

Veranstalter:
  Schreberverein Nord e. V.

Startseite – Titel:
  Willkommen zur Mitgliederversammlung

Startseite – Willkommenstext:
  Herzlich willkommen, liebe Gartenfreunde!


.. image:: _static/images/tutorial_de_1_03.png
 :class: screenshot

Klicken Sie anschließend auf ``Speichern``. Auch bei allen folgenden Eingaben dieses Tutorials müssen Sie stets auf ``Speichern`` klicken, um die Eingabe abzuschließen.

Wenn Sie nun links oben auf das Projektor-Logo klicken, kommen Sie zur Startseite von OpenSlides.

.. image:: _static/images/tutorial_de_1_04.png
 :class: screenshot


Einrichtung eigener Folien
--------------------------

Um erste benutzerdefinierte Folien hinzuzufügen, wechseln Sie zum Tab „Projektor“. Klicken Sie in dem Fenster „Benutzerdefinierte Folien“ auf ``Neue Folie``

.. image:: _static/images/tutorial_de_1_05.png
 :class: screenshot


und geben Sie eine Folie wie folgt ein:

Titel:
  Kaffeepause um 15.30 Uhr

Text:
  Bitte kommen Sie pünktlich um 16.00 Uhr zurück in den Saal.

.. image:: _static/images/tutorial_de_1_06.png
 :class: screenshot

Die Ansicht im Tab „Projektor“ müsste nun wie folgt aussehen:

.. image:: _static/images/tutorial_de_1_07.png
 :class: screenshot


Technische Einrichtung im Veranstaltungsraum
--------------------------------------------

Richten Sie Ihren Veranstaltungsraum ein. Im Präsentationsmodus Single schließen Sie den Beamer an Ihren Computer an und schieben ein zweites Browserfenster auf den erweiterten Bildschirm. Ansonsten richten Sie ein Netzwerk ein, schließen Sie einen beliebigen Computer an den Beamer an und öffnen im Vollbildmodus die Seite mit der Projektoransicht. Den entsprechend Link finden Sie bei OpenSlides im Tab „Projektor“ auf der linken Seite. Er lautet zum Beispiel ``http://192.168.x.y/projector/`` wobei x und y für je eine bestimmte Zahl mit ein bis drei Ziffern stehen.

.. image:: _static/images/tutorial_de_1_08.png
 :class: screenshot

Das Beamerbild sieht zurzeit wie folgt aus:

.. image:: _static/images/tutorial_de_1_09.png
 :class: screenshot


Auswahl der Beamerfolien
------------------------

Testen Sie, ob auf dem Beamer die gewünschten Folien zu sehen sind, wenn Sie bei OpenSlides im Tab „Projektor“ verschiedene Folien auswählen. Sie können eine bestimmte Folien anwählen, indem Sie auf den jeweiligen grauen Haken klicken. Die jeweils aktive Folie zeigt einen blauen Haken.

.. image:: _static/images/tutorial_de_1_10.png
 :class: screenshot

Das volle Potenzial von OpenSlides entfaltet sich, wenn Sie über Tagesordnung, Anträge und Wahlen zahlreiche Folien anlegen, die Sie während der Veranstaltung zeigen und im Hintergrund editieren können.

Wenn Sie zwischendurch eine kurze Nachricht, zum Beispiel ein Fußballergebnis, einblenden wollen, ohne dass dazu eine extra Folie angelegt werden soll, können Sie die Message-Funktion im Fenster „Einblendungen“ benutzen. Schreiben Sie im Fenster „Einblendungen“ unter „Message“ die Nachricht „Bayern 1 : 1 Dortmund“, klicken auf ``Übernehmen`` und aktivieren die Einblendung, indem Sie auf den davor gestellten grauen Haken klicken.

.. image:: _static/images/tutorial_de_1_11.png
 :class: screenshot

Das Beamerbild sieht dann wie folgt aus:

.. image:: _static/images/tutorial_de_1_12.png
 :class: screenshot

Schalten Sie die Einblendung wieder aus, indem Sie erneut auf den (nunmehr blauen) Haken klicken.

Weiter geht es mit dem zweiten Teil des Tutorials: `Tagesordnung verwalten`__

.. __: tutorial_de_2.html
