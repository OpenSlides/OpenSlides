Tutorial – Präsentationsmodus
=============================

In diesem Tutorial lernen Sie am Beispiel der Mitgliederversammlung eines Kleingartenvereins, wie Sie OpenSlides im Präsentationsmodus bedienen. Dabei gehen Sie von folgenden Rahmenbedingungen aus.

Der Verein „Schreberverein Nord e. V.“ hält am 3. März 2012 seine jährliche Mitgliederversammlung ab. Der Vorstand erwartet etwa 40 Teilnehmer. Auf der Versammlung werden verschiedene Berichte gehalten und über eine Satzungsänderung und einen Antrag für ein Gartenfest abgestimmt. Außerdem finden Wahlen zum Vorstand (drei Personen) und zum Beirat (sieben Personen) statt.


Vorbereitung der Veranstaltung
++++++++++++++++++++++++++++++

Installation und Start des Servers
----------------------------------

Installieren Sie OpenSlides wie hier__ beschrieben. Starten Sie den Server wie hier__ beschrieben. Sie sehen jetzt die Login-Seite von OpenSlides in Ihrem Browser. Loggen Sie sich als Administrator wie hier__ beschrieben ein.

.. __: chapter2.html#installation
.. __: chapter2.html#start-des-servers-und-offnen-des-browsers
.. __: chapter2.html#erster-login


Ändern des Administrator-Passworts
----------------------------------

Ändern Sie zuerst das Passwort des Administrators. Klicken Sie oben rechts auf „Benutzereinstellungen“ und dann im linken Seitenmenü auf „Passwort Einstellungen“. Geben Sie in die entsprechenden Felder Ihr altes Passwort ``admin`` und als neues Passwort ``geheim`` ein. Wiederholen Sie das neue Passwort im dritten Formularfeld. Bestätigen Sie die Eingabe mit ``Speichern``.

**TODO:** Prüfen, ob `Ticket #310 <http://dev.openslides.org/ticket/310>`_ erfüllt ist

.. image:: _static/images/tutorial_de_01.png


Konfiguration des Systems
-------------------------

Zunächst sind einige Einstellungen wie die Rahmendaten der Veranstaltung und die Anzahl der benötigten Stimmzettel vorzunehmen.

Wechseln Sie zum Tab „Konfiguration“ und geben Sie die Allgemeinen Einstellungen wie folgt ein:

.. image:: _static/images/tutorial_de_02.png

Klicken Sie anschließend auf ``Speichern``. Auch bei allen folgenden Eingaben dieses Tutorials müssen Sie stets auf ``Speichern`` klicken, um die Eingabe abzuschließen.

Klicken Sie links auf „Antrag“ und stellen Sie die Antragseinleitung und die Anzahl der Stimmzettel wie folgt ein:

.. image:: _static/images/tutorial_de_03.png

Klicken Sie links auf „Wahl“ und stellen Sie ebenfalls die Anzahl der Stimmzettel wie folgt ein:

.. image:: _static/images/tutorial_de_04.png

Bei Anträgen und Wahlen kann es unter Umständen vorkommen, dass verschieden viele Stimmzettel benötigt werden, weshalb hierfür jeweils eigene Einstellungen vorzunehmen sind.


Eingabe der Teilnehmer und Teilnehmerinnen
------------------------------------------

Nun sind die Teilnehmer und Teilnehmerinnen einzutragen. Personen, die das System verwalten sollen, müssen die entsprechenden Berechtigungen zugewiesen werden.

*Grundsätzlich brauchen Sie nur diejenigen Teilnehmer und Teilnehmerinnen erfassen, die das System verwalten, Anträge stellen oder unterstützen oder bei Wahlen kandidieren.*

Wechseln Sie zum Tab „Teilnehmer/innen“. Klicken Sie links auf „Neue/r Teilnehmer/in“ und geben Sie einen neuen Teilnehmer wie folgt ein:

.. image:: _static/images/tutorial_de_05.png

Wiederholen Sie diese Schritte und geben Sie folgende weitere Teilnehmer und Teilnehmerinnen ein: Peter Müller, Franziska Meyer, Luise Schmidt und Hans Schulze.

Wenn Sie anschließend links auf „Alle Teilnehmer/innen“ klicken, müssten Sie folgende Übersicht sehen:

.. image:: _static/images/tutorial_de_06.png

*Bei Ihrer eigenen Veranstaltung lohnt es sich, zuvor alle Teilnehmer und Teilnehmerinnen in einer CSV-Datei zu erfassen und wie hier (**TODO LINK**) erläutert zu importieren.*

Klicken Sie nur beim Teilnehmer „Max Mustermann“ unter der Rubrik „Aktionen“ auf das Bearbeiten-Symbol |document-edit| und weisen Sie der Person die Benutzerrollen „Tagesleitung“ und „Delegierter“ zu. Um mehrere Einträge auszuwählen, halten Sie beim Anklicken die Taste ``Strg`` gedrückt.

.. image:: _static/images/tutorial_de_07.png

Um das Passwort von Max Mustermann neu zu setzen, klicken Sie erneut auf das Bearbeiten-Symbol |document-edit| und tragen Sie unten unter „Erst-Passwort“ ein neues, selbstgewähltes Passwort ein.  Für dieses Tutorial sei als Passwort ``geheim`` gewählt. Anschließend klicken Sie auf „Übernehmen“ und erst danach auf den Link „Auf Erst-Passwort zurücksetzen“. Bestätigen Sie den oben auf der Seite erscheinenden Dialog mit „Ja“.

.. |document-edit| image:: _static/images/document-edit.png


Eingabe der bereits vorliegenden Anträge
----------------------------------------

Vor Beginn der Veranstaltung liegen bereits zwei Anträge an die Versammlung vor, welche ins System gebracht werden sollen.

Wechseln Sie zum Tab „Anträge“ und klicken Sie links auf „Neuer Antrag“. Geben Sie einen Antrag wie folgt ein:

.. image:: _static/images/tutorial_de_08.png

Die Antragsseite müsste nun wie folgt aussehen:

.. image:: _static/images/tutorial_de_09.png

Da der Antrag in unserem Fall ohne weitere Voraussetzungen (formal) zulässig ist, klicken Sie rechts auf „Zulassen“. Dem Antrag wird automatisch eine fortlaufende Nummer zugewiesen.

Geben Sie auf die gleiche Weise einen weiteren Antrag wie folgt ein:

.. image:: _static/images/tutorial_de_10.png

Danach klicken Sie wieder auf „Zulassen“. Die Antragsübersicht (links bei „Alle Anträge“) müsste nun so aussehen:

.. image:: _static/images/tutorial_de_11.png


Eingabe der anstehenden Wahlen/Wahlämter
----------------------------------------

Ebenfalls vor Veranstaltungsbeginn sind die anstehenden Wahlen vorzubereiten. Geben Sie dazu im Tab „Wahlen“ links unter „Neue Wahl“ ein Wahlamt wie folgt ein:

.. image:: _static/images/tutorial_de_12.png

Geben Sie auf die gleiche Weise einen weiteres Wahlamt wie folgt ein:

.. image:: _static/images/tutorial_de_13.png

Die Wahlübersicht (links bei „Alle Wahlen“) müsste nun so aussehen:

.. image:: _static/images/tutorial_de_14.png


Eingabe der Tagesordnung
------------------------

Die Tagesordnung enthält noch keine Einträge. Legen Sie zunächst einige Einträge an.

Klicken Sie dazu im Tab „Tagesordnung“ auf „Neuer Eintrag“ und geben Sie den Eintrag wie folgt ein:

.. image:: _static/images/tutorial_de_15.png

Erweitern Sie die Tagesordnung mit folgenden weiteren Punkten: Bericht des Vorstandes, Satzungsänderung, Gartenfest, Sonstiges, Wahlen der Vereinsämter

Ziehen Sie nun mit der Maus an den gekreuzten Pfeilen des Punktes bla, um seine Position zu verändern. Richten Sie die Tagesordnung durch Verschieben der Punkte so ein, dass sie wie folgt aussieht:

.. image:: _static/images/tutorial_de_16.png

Klicken Sie auf ``Speichern``, um die geänderte Reihenfolge festzulegen.

*Zu jedem Antrag und zu jedem Wahlamt können Sie über einen Link im Seitenmenü des betreffenden Antrags oder Wahlamts auch einen eigenen Eintrag in der Tagesordnung erstellen, der direkt mit der Antrags- bzw. Wahlfolie verknüpft ist. Dies empfiehlt sich, wenn ein einzelner Antrag oder eine einzelne Wahl an einer bestimmten Stelle der Tagesordnung behandelt werden soll.*

Ändern Sie nun den Inhalt des Tagesordnungspunktes „Bericht des Vorstandes“, indem Sie in der Zeile dieses Punktes auf das Bearbeiten-Symbol |document-edit| klicken und zusätzlich zum Titel einen Text zum Tagesordnungspunkt wie folgt eingeben:

.. image:: _static/images/tutorial_de_17.png

.. |document-edit| image:: _static/images/document-edit.png


Hinzufügen benutzerdefinierter Folien
-------------------------------------

Wechseln Sie zum Tab „Projektor“. Wie Sie sehen, sind alle Tagesordnungseinträge sowie die angelegten Anträge und Wahlämter bereits als Folien auswählbar.

Fügen Sie noch eine benutzerdefinierte Folie mit dem Titel „Kaffeepause“ hinzu, indem Sie bei dem Fenster „Benutzerdefinierte Folien“ auf „Neue Folie“ klicken und wie schon zuvor die Folie eintragen.

Die Ansicht im Tab „Projektor“ müsste nun wie folgt aussehen:

.. image:: _static/images/tutorial_de_18.png


Technische Einrichtung im Veranstaltungsraum
--------------------------------------------

Richten Sie Ihren Veranstaltungsraum ein. Im Präsentationsmodus Single schließen Sie den Beamer an Ihren Computer an und schieben ein zweites Browserfenster auf den erweiterten Bildschirm. Ansonsten richten Sie ein Netzwerk ein, schließen Sie einen beliebigen Computer an den Beamer an und öffnen im Vollbildmodus die Seite mit der Projektoransicht. Den entsprechend Link finden Sie bei OpenSlides im Tab „Projektor“ auf der linken Seite.


Testen
------

Testen Sie, ob auf dem Beamer die gewünschten Folien zu sehen sind, wenn Sie bei OpenSlides im Tab „Projektor“ verschiedene Folien auswählen. Sie können eine bestimmte Folien anwählen, indem Sie auf den jeweiligen grauen Haken klicken. Die jeweils aktive Folie zeigt einen blauen Haken.

Die verschiedenen Folien müssten auf dem Beamer wie folgt aussehen:

.. image:: _static/images/tutorial_de_19.png

.. image:: _static/images/tutorial_de_20.png

.. image:: _static/images/tutorial_de_21.png

.. image:: _static/images/tutorial_de_22.png

.. image:: _static/images/tutorial_de_23.png



Durchführung der Veranstaltung
++++++++++++++++++++++++++++++

Für die Durchführung der Veranstaltung gehen wir von folgender Aufgabenteilung aus. Der Vereinsvorsitzende leitet die Versammlung und sitzt in der Mitte des Podiums. Sie sitzen in seiner Nähe und steuern den Beamer, indem Sie im Tab „Projektor“ die jeweils gewünschten Folien auswählen. Herr Max Mustermann sitzt an einem weiteren Rechner, an dem ein Drucker angeschlossen ist. Im Präsentationsmodus Single muss auch der Drucker an ihren Rechner angeschlossen sein. Die Rolle des Max Mustermann entfällt.


Beginn und erste Tagesordnungspunkte
------------------------------------

Zu Beginn der Versammlung wählen Sie im Tab „Projektor“ die Willkommensseite aus, so dass Ihre Ansicht und die Beameransicht wie folgt zu sehen sind:

.. image:: _static/images/tutorial_de_24.png

.. image:: _static/images/tutorial_de_25.png

Während die ersten Tagesordnungspunkte abgehandelt werden, wählen Sie indem Sie im Tab „Projektor“ die jeweils gewünschten Folien aus.

Da zwischendurch ein Fußballergebnis angezeigt werden soll, schreiben Sie im Fenster „Einblendungen“ unter „Message“ die Nachricht „Bayern 1 : 1 Dortmund“, klicken auf „Übernehmen“ und aktivieren die Einblendung, indem Sie auf den davor gestellten grauen Haken klicken.

Das Beamerbild sieht dann wie folgt aus:

.. image:: _static/images/tutorial_de_26.png

Schalten Sie die Einblendung wieder aus, indem Sie erneut auf den (nunmehr blauen) Haken klicken.


Anträge
-------

Wenn der Vorsitzende den Antrag zur Satzungsänderung aufruft, klicken Sie zunächst im Tab „Projektor“ auf den entsprechenden Haken vor dem ersten Antrag.

Um schnell zur Antragsverwaltung zu wechseln, können Sie auf den Titel des Antrags klicken.

Die Antragsansicht sieht dann wie folgt aus:

.. image:: _static/images/tutorial_de_27.png

Nach Abschluss der Diskussion ruft der Vorsitzende zur Abstimmung. Klicken Sie auf „Neue Abstimmung“ und tragen Sie das Abstimmungsergebnis wie folgt in das Formular ein:

.. image:: _static/images/tutorial_de_28.png

Der Vorsitzende stellt fest, dass der Antrag angenommen ist. Klicken Sie deshalb auf „Angenommen“.

Das Beamerbild sieht nun wie folgt aus:

.. image:: _static/images/tutorial_de_29.png


Wahlen
------

Wenn der Vorsitzende die Wahlen zum neuen Vorstand aufruft, klicken Sie zunächst im Tab „Projektor“ auf den entsprechenden Haken vor der ersten Wahl. Wechseln Sie dann zur Wahlansicht, indem Sie auf den Titel der Wahl klicken.

Die Wahlansicht sieht dann wie folgt aus:

.. image:: _static/images/tutorial_de_30.png

Es werden nun verschiedene Kandidaten vorgeschlagen, die Sie durch Auswahl eines Teilnehmers und Klick auf „Übernehmen“ auf die Kandidatenliste setzen können.

*Das kleine Symbol neben dem dem Auswahlformular ist ein direkter Link zur Eingabe eines neuen Teilnehmers. Die kann sehr nützlich sein, wenn kurzfristig eine Person nominiert wird, die noch nicht ins System eingetragen wurde.*

.. image:: _static/images/tutorial_de_31.png

Steht die Kandidatenauswahl fest, ändern Sie rechts den Status der Wahl auf „Im Wahlgang“. Klicken Sie anschließend unten auf „Neuer Wahlgang“, um einen ersten Wahlgang anzulegen. Da es eine geheime Wahl ist und die Stimmzettel erst ausgeteilt werden müssen, können Sie jetzt noch keine Wahlergebnisse eintragen.

Herr Max Mustermann, dessen Computer mit dem Drucker verbunden ist, begibt sich ins Netzwerk, ruft in seinem Browser die OpenSlides-Seite auf und loggt sich mit seinem Benutzernamen ``Max Mustermann`` und seinem Passwort ``geheim`` ein. Er klickt im Tab „Wahlen“ auf die erste Wahl und dort unten auf das Bearbeiten-Symbol |document-edit| bei ersten Wahlgang.

Seine Ansicht sieht dann wie folgt aus:

.. image:: _static/images/tutorial_de_32.png

.. |document-edit| image:: _static/images/document-edit.png

Anschließend klickt er auf „Stimmzettel als PDF“. OpenSlides liefert ihm daraufhin eine PDF-Datei, die er direkt ausdrucken kann. Die Stimmzettel können anschließend auseinandergeschnitten und verteilt werden.

*Bei mehrfachen Wahlen bietet es sich der Einsatz einer Hebelschere an.*

*Im Präsentationsmodus Single übernehmen Sie die Aufgaben des Max Mustermann selbst.*

Nach Auszählung der Stimmzettel tragen Sie die Ergebnisse in eben dieses Formular des ersten Wahlgangs ein:

.. image:: _static/images/tutorial_de_33.png

Klicken Sie anschließend auf den grauen Knopf bei ersten Wahlgang, um die Wahlergebnisse auf dem Beamer zu veröffentlichen.

.. image:: _static/images/tutorial_de_34.png


Schluss der Versammlung
-----------------------

Am Ende der Versammlung können Sie sich für das Protokoll einige Anhänge direkt aus OpenSlides holen. Klicken Sie jeweils im Tab „Tagesordnung“, „Anträge“ und „Wahlen“ auf die Links „Tagesordnung als PDF“, „Alle Anträge als PDF“ und „Alle Wahlen als PDF“, die sich jeweils im linken Seitenmenu befinden.

.. Aufgabenteilung: Vorsitzender leitet die Versammlung, Sie steuern den Beamer, ein Dritter (Max Mustermann) sitzt am Drucker. TODO: Schilder des Ablaufs während der Versammlung, klicken hin und her, Anträge, geheime Abstimmungm, Wahlzettel, Ergebnisse eintragen, bestätigen. Redezeitbegrenzung, spontane Rednerliste - Aufgabenteilung, ein andere macht Login als MaxMustermann, wählt die Kandidaten

