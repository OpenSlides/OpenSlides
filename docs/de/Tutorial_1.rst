.. raw:: latex

   \newpage

Einrichtung von OpenSlides
==========================

Zunächst müssen Sie OpenSlides auf dem Server installieren, den Server
starten und einige Einstellungen für Ihre Veranstaltung vornehmen. Danach
können Sie Ihre ersten Folien einrichten und auf dem Projektor zeigen.


Installation und Start des Servers
----------------------------------

Installieren Sie OpenSlides wie im Kapitel „Erste Schritte", Abschnitt
`Installation`__ beschrieben. Starten Sie anschließend den Server wie im
Abschnitt `Start des Servers und Öffnen des Browsers`__ erläutert.
Sie sehen jetzt die Login-Seite von OpenSlides in Ihrem
Browser. Loggen Sie sich als Administrator ein, indem Sie als Benutzernamen
``admin`` und als Passwort ``admin`` eingeben und auf ``Anmelden`` klicken.

.. autoimage:: Tutorial_1_01.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Loginmaske

Anschließend sollten Sie sofort das Administrator-Passwort ändern. Geben
Sie in die entsprechenden Felder Ihr altes Passwort ``admin`` und
anschließend Ihr neues Passwort ein. Wiederholen Sie das neue Passwort im
dritten Formularfeld. Bestätigen Sie die Eingabe mit ``Speichern``.

.. autoimage:: Tutorial_1_02.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Formular zum Passwort ändern

.. __: FirstSteps.html#installation
.. __: FirstSteps.html#start-des-servers-und-offnen-des-browsers


Konfiguration des Systems
-------------------------

Geben Sie die Rahmendaten Ihrer Veranstaltung ins System ein. Wechseln Sie
dazu zum Menüpunkt „Konfiguration“ (Allgemein) und geben Sie die
Veranstaltungsdaten wie folgt ein:

Veranstaltungsname:
  Schreberverein Nord e. V.

Kurzbeschreibung der Veranstaltung:
  Mitgliederversammlung des Vereins 2013

Veranstaltungszeitraum:
  Sonnabend, 2. März 2013

Veranstaltungsort:
  Leipzig

Veranstalter:
  Schreberverein Nord e. V.

Geben Sie außerdem für das Willkommens-Widget ein:

Startseite – Titel:
  Willkommen zur Mitgliederversammlung

Startseite – Willkommenstext:
  Herzlich willkommen, liebe Gartenfreunde!


.. autoimage:: Tutorial_1_03.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Allgemeine Konfiguration

Klicken Sie anschließend auf ``Speichern``. Auch bei allen folgenden
Eingaben dieses Tutorials müssen Sie stets auf ``Speichern`` klicken, um
die Eingabe abzuschließen.


Einrichtung eigener Folien
--------------------------

Um erste benutzerdefinierte Folien hinzuzufügen, wechseln Sie zum Menüpunkt
„Dashboard“. Klicken Sie in dem Widget „Benutzerdefinierte Folien“ auf
``Neu``

.. autoimage:: Tutorial_1_04.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Widget Benutzerdefinierte Folien

und geben Sie eine Folie wie folgt ein:

Titel:
  Kaffeepause um 15.30 Uhr

Text:
  Bitte kommen Sie pünktlich um 16.00 Uhr zurück in den Saal.

.. autoimage:: Tutorial_1_05.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Bearbeitungsformular der Benutzerdefinierten Folie

Die Ansicht im Menüpunkt „Dashboard“ müsste nun wie folgt aussehen:

.. autoimage:: Tutorial_1_06.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Dashboard mit neu angelegter benutzerdefinierter Folie


Technische Einrichtung im Veranstaltungsraum
--------------------------------------------

Richten Sie Ihren Veranstaltungsraum ein. Im Präsentationsmodus Single
schließen Sie den Projektor an Ihren Computer an und schieben ein zweites
Browserfenster auf den erweiterten Bildschirm. In den anderen Modi richten Sie ein
Netzwerk ein, schließen Sie einen beliebigen Computer an den Projektor an und
öffnen im Vollbildmodus die Seite mit der Projektoransicht. Den
entsprechend Link finden Sie bei OpenSlides im Menüpunkt „Dashboard“ bei
der Projektor-Live-Ansicht. Er lautet zum Beispiel
``http://192.168.x.y/projector/`` wobei x und y für je eine bestimmte Zahl
mit ein bis drei Ziffern stehen.

.. autoimage:: Tutorial_1_07.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Widget Projektor-Live-Ansicht

Das Projektorbild sieht zurzeit wie folgt aus:

.. autoimage:: Tutorial_1_08.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Projektor-Ansicht


Auswahl der Projektorfolien
---------------------------

Testen Sie, ob auf dem Projektor die gewünschten Folien zu sehen sind, wenn
Sie bei OpenSlides im Menüpunkt „Dashboard“ verschiedene Folien auswählen.
Sie können eine bestimmte Folie anwählen, indem Sie auf das jeweilige
Projektorsymbol |projector| klicken. Die jeweils aktive Folie zeigt ein
blaues Projektorsymbol.

.. autoimage:: Tutorial_1_09.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Ausgewählte Folie im Widget Benutzerdefinierte Folien

.. |projector| image:: ../_images/projector.png

Das volle Potenzial von OpenSlides entfaltet sich, wenn Sie über
Tagesordnung, Anträge und Wahlen zahlreiche Folien anlegen, die Sie während
der Veranstaltung zeigen und im Hintergrund editieren können.

Wenn Sie zwischendurch eine kurze Nachricht, zum Beispiel ein
Fußballergebnis, einblenden wollen, ohne dass dazu eine extra Folie
angelegt werden soll, können Sie die Mitteilungsfunktion im Fenster
„Einblendungen“ benutzen. Schreiben Sie unter „Mitteilung“ die Nachricht
„Bayern 1 : 1 Dortmund“, klicken auf den blauen Haken („Übernehmen“) und
aktivieren schließlich die Einblendung, indem Sie auf das davor gestellte
Kästchen klicken.

.. autoimage:: Tutorial_1_10.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Mitteilung projizieren im Widget Einblendungen

Schalten Sie die Einblendung wieder aus, indem Sie erneut auf das (nunmehr
blaue) Kästchen klicken.


Weiter geht es mit dem zweiten Teil des Tutorials: `Tagesordnung verwalten`__

.. __: Tutorial_2.html
