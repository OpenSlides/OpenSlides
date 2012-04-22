Tutorial – Präsentationsmodus
=============================

In diesem Tutorial lernen Sie am Beispiel der Mitgliederversammlung eines Gartenvereins, wie Sie OpenSlides im Präsentationsmodus bedienen. Dabei gehen Sie von folgenden Rahmenbedingungen aus.

Der Verein „Schreberverein Nord e. V.“ hält am 3. März 2012 seine jährliche Mitgliederversammlung ab. Der Vorstand erwartet etwa 40 Teilnehmer. Auf der Versammlung werden verschiedenen Berichte gehalten und über eine Satzungsänderung und einen Antrag für ein Gartenfest abgestimmt. Außerdem finden Wahlen zum Vorstand (drei Personen) und zum Beirat (sieben Personen) statt.


Vorbereitung der Veranstaltung
++++++++++++++++++++++++++++++

Installation und Start des Servers
----------------------------------

Installieren Sie OpenSlides wie hier__ beschrieben. Starten Sie den Server wie hier__ beschrieben.

.. __: chapter2.html#installation
.. __: chapter2.html#start-des-servers


Konfiguration des Systems
-------------------------

Zunächst sind einige Einstellungen wie die Rahmendaten der Veranstaltung und die Anzahl der benötigten Stimmzettel vorzunehmen.

Wechseln Sie zum Tab „Konfiguration“ und geben Sie die Allgemeinen Einstellungen wie folgt ein:

.. image:: _static/images/tutorial_de_01.png

Klicken Sie anschließend auf ``Speichern``. Auch bei allen folgenden Eingaben dieses Tutorials müssen Sie stets auf ``Speichern`` klicken, um die Eingabe abzuschließen.

Klicken Sie links auf „Antrag“ und stellen Sie die Antragseinleitung und die Anzahl der Stimmzettel wie folgt ein:

.. image:: _static/images/tutorial_de_02.png

Klicken Sie links auf „Wahl“ und stellen Sie ebenfalls die Anzahl der Stimmzettel wie folgt ein:

.. image:: _static/images/tutorial_de_03.png

Bei Anträgen und Wahlen kann es unter Umständen vorkommen, dass verschieden viele Stimmzettel benötigt werden, weshalb hierfür jeweils eigene Einstellungen vorzunehmen sind.


Eingabe der Teilnehmer und Teilnehmerinnen
------------------------------------------

Nun sind die Teilnehmer und Teilnehmerinnen einzutragen. Personen, die das System verwalten sollen, müssen die entsprechenden Berechtigungen zugewiesen werden.

*Grundsätzlich brauchen Sie nur diejenigen Teilnehmer und Teilnehmerinnen erfassen, die das System verwalten, Anträge stellen oder unterstützen oder bei Wahlen kandidieren.*

Wechseln Sie zum Tab „Teilnehmer/innen“. Klicken Sie links auf „Neue/r Teilnehmer/in“ und geben Sie einen neuen Teilnehmer wie folgt ein:

.. image:: _static/images/tutorial_de_04.png

Wiederholen Sie diese Schritte und geben Sie folgende weitere Teilnehmer und Teilnehmerinnen ein: Peter Müller, Franziska Meyer, Luise Schmidt und Hans Schulze.

Wenn Sie anschließend links auf „Alle Teilnehmer/innen“ klicken, müssten Sie folgende Übersicht sehen:

.. image:: _static/images/tutorial_de_05.png

*Bei Ihrer eigenen Veranstaltung lohnt es sich, zuvor alle Teilnehmer und Teilnehmerinnen in einer CSV-Datei zu erfassen und wie hier (TODO LINK) erläutert zu importieren.*

Klicken Sie nur beim Teilnehmer „Max Mustermann“ unter der Rubrik „Aktionen“ auf das Bearbeiten-Symbol |document-edit| und weisen Sie der Person die Benutzerrolle „Versammlungsleitung“ zu.

.. image:: _static/images/tutorial_de_06.png
.. |document-edit| image:: _static/images/document-edit.png


Eingabe der bereits vorliegenden Anträge
----------------------------------------

Vor Beginn der Veranstaltung liegen bereits zwei Anträge an die Versammlung vor, welche ins System gebracht werden sollen.

Wechseln Sie zum Tab „Anträge“ und klicken Sie links auf „Neuer Antrag“. Geben Sie einen Antrag wie folgt ein:

.. image:: _static/images/tutorial_de_07.png

Geben Sie auf die gleiche Weise einen weiteren Antrag wie folgt ein:

.. image:: _static/images/tutorial_de_08.png

Die Antragsübersicht (links bei „Alle Anträge“) müsste nun so aussehen:

.. image:: _static/images/tutorial_de_09.png


Eingabe der anstehenden Wahlen/Wahlämter
----------------------------------------

Ebenfalls vor Veranstaltungsbeginn sind die anstehenden Wahlen vorzubereiten. Geben Sie dazu im Tab „Wahlen“ links unter „Neue Wahl“ ein Wahlamt wie folgt ein:

.. image:: _static/images/tutorial_de_10.png

Geben Sie auf die gleiche Weise einen weiteres Wahlamt wie folgt ein:

.. image:: _static/images/tutorial_de_11.png

Die Wahlübersicht (links bei „Alle Wahlen“) müsste nun so aussehen:

.. image:: _static/images/tutorial_de_12.png


Eingabe der Tagesordnung
------------------------

Die Tagesordnung enthält bereits drei/sieben Einträge. Fügen Sie zunächst einige weitere Einträge hinzu.

Klicken Sie dazu im Tab „Tagesordnung“ auf „Neuer Eintrag“ und geben Sie den Eintrag wie folgt ein:

.. image:: _static/images/tutorial_de_13.png

Erweitern Sie die Tagesordnung mit folgenden weiteren Punkten: bla bla bla (**TODO**)

Ziehen Sie nun mit der Maus an den gekreuzten Pfeilen des Punktes bla, um seine Position zu verändern. Richten Sie die Tagesordnung durch Verschieben der Punkte so ein, dass sie wie folgt aussieht:

.. image:: _static/images/tutorial_de_14.png

Klicken Sie auf ``Speichern``, um die geänderte Reihenfolge festzulegen.


Hinzufügen weitere Beamerfolien
-------------------------------

Wechseln Sie zum Tab „Beamer“. Wie Sie sehen, sind alle Tagesordnungseinträge sowie die angelegten Anträge und Wahlämter bereits als Folien auswählbar.

TODO: Weitere Folien hinzufügen.


Technische Einrichtung im Veranstaltungsraum
--------------------------------------------

Richten Sie Ihren Veranstaltungsraum ein. Im Präsentationsmodus Single schließen Sie den Beamer an Ihren Computer an und schieben ein zweites Browserfenster auf den erweiterten Bildschirm. Ansonsten richten Sie ein Netzwerk ein, schließen Sie einen beliebigen Computer an den Beamer an und öffnen im Vollbildmodus die Seite mit der Beameransicht. Den entsprechend Link finden Sie bei OpenSlides im Tab „Beamer“ auf der linken Seite.


Testen
------

Testen Sie, ob auf dem Beamer die gewünschten Folien zu sehen sind, wenn Sie bei OpenSlides im Tab „Beamer“ verschiedene Folien auswählen. Sie können eine bestimmte Folien anwählen, indem Sie auf den jeweiligen grauen Haken klicken. Die jeweils aktive Folie zeigt einen blauen Haken.



Durchführung der Veranstaltung
++++++++++++++++++++++++++++++

TODO




