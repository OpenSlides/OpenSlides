Tagesordnung
++++++++++++

Unter der Rubrik Tagesordnung können Sie einzelne Tagesordnungspunkte
erstellen und verwalten.


Einen neuen Tagesordnungspunkt erstellen
----------------------------------------

Um einen neuen Punkt auf die Tagesordnung zu setzen, klicken Sie unter dem
Menüpunkt „Tagesordnung“ auf den rechts oben befindlichen blauen Button „Neu“.

.. image:: ../_images/Platzhalter.png
   :class: screenshot

.. Menüseite Tagesordnung ohne Einträge (keine TOPS)

Es öffnet sich eine Seite, auf der Sie den neuen Eintrag bearbeiten können.
Erforderliche Angaben für die Erstellung eines neuen Tagesordnungspunktes
sind der „Titel“ und der „Typ“. Unterschieden wird bei den Typen nach einem
Tagesordnungseintrag für inhaltliche Themen und einem organisatorischen
Eintrag, der die Sitzung strukturiert. Ein organisatorischer Eintrag kann
beispielsweise eine Pause sein. Dieser wird bei der Dauer der Sitzung mit
einberechnet, ist für die Benutzer auf der Tagesordnung aber nicht sichtbar.
Bei der Projektion der gesamten Tagesordnung oder einzelner Unterpunkte
erscheint ein organisatorischer Eintrag ebenfalls nicht.

Zusätzlich haben Sie die Möglichkeit, unter dem „Titel“ einen „Text“
einzufügen, der auf dem Projektor erscheinen soll. Einträge im Feld
„Kommentar“ sind nur für die Versammlungsleitung sichtbar.

Im Feld „Dauer“ können Sie die geplante Zeit des Tagesordnungspunktes im
Format „hh:mm“ (Stunden:Minuten) angeben. Auf der Übersichtsseite der
Tagesordnung werden alle eingegebenen Zeiten summiert und visualisiert.

*Im Menüpunkt „Konfiguration“ in der oberen Leiste unter „Tagesordnung“
können Sie die genaue Anfangszeit Ihrer Veranstaltung eingeben. OpenSlides
ermittelt dann automatisch das rechnerische Ende.*

Die Bearbeitung des Feldes „Elternelement“ dient der `Strukturierung von
Tagesordnungspunkten`_.

Schließlich haben Sie noch die Möglichkeit, die „Rednerliste“ als
geschlossen zu markieren. Dies kann sinnvoll sein, wenn beispielsweise ein
Tagesordnungspunkt vorhanden ist, zu dem nicht gesprochen werden soll. Somit
wird verhindert, dass sich ein Teilnehmer/eine Teilnehmerin auf die
Rednerliste setzt.

Klicken Sie „Speichern“ oder, wenn Sie den Eintrag gleich weiter bearbeiten
wollen, „Übernehmen“.


Strukturierung von Tagesordnungspunkten
---------------------------------------

Die Strukturierung von Tagesordnungspunkten kann man direkt bei der
Erstellung eines neuen Tagesordnungspunktes oder auf der Übersichtsseite der
Tagesordnung vornehmen.

Bei der Erstellung eines neuen Tagesordnungspunktes dient das Feld
„Elternelement“ der Strukturierung. Sobald ein oder mehrere
Tagesordnungspunkte vorhanden sind, kann beim Eintrag eines neuen
entschieden werden, ob dieser ein Unterpunkt eines bereits eingetragenenen
werden soll. Der neue Eintrag wird dann ein so genanntes Kind-Element zu
einem schon existierenden Eltern-Element. Wenn kein Punkt ausgewählt wird
(gestrichelte Linie), rangiert er auf der obersten Ebene. Klicken Sie in
jedem Fall abschließend auf „Speichern“, um das Eingetragene zu sichern.

Eine andere Möglichkeit der Strukturierung von Tagesordnungspunkten besteht
darin, auf der Übersichtsseite der Tagesordnung die einzelnen Einträge mit
der Maus horizontal und vertikal an die gewünschte Position zu verschieben.
Die geänderte Reihenfolge muss am Ende im oben erscheinenden Dialog
bestätigt werden.

.. image:: ../_images/Platzhalter.png
   :class: screenshot

.. Menüseite mit mehreren TOPS, auch Unterpunkte, die verschoben sind, oben Dialogfeld Bestätigen


Projizierung
------------

Für das Projizieren von Tagesordnungspunkten und Rednerlisten nutzt
OpenSlides verschiedene Buttons mit Symbolen.

Um die gesamte Tagesordnung anzuzeigen, klicken Sie entweder auf dem
Dashboard auf den Projektor-Button |projector| vor dem Wort Tagesordnung
oder auf der Tagesordnungsseite auf den Projektor-Button in der oberen Zeile
rechts. Projiziert werden nur die Haupttagesordnungspunkte, nicht die
Unterpunkte.

.. image:: ../_images/Platzhalter.png
   :class: screenshot

.. Projektorbild der TO (3 TOPS)

Sie haben die Möglichkeit, auch einzelne Tagesordnungspunkte mit ihren
dazugehörigen Texten anzeigen zu lassen. Nutzen Sie dafür den
Projektor-Button |projector|, der sich auf dem Dashboard links neben den
jeweiligen Einträgen befindet oder den, der auf der Tagesordnungsseite in
der Spalte „Aktionen“ liegt.

.. |projector| image:: ../_images/projector.png

Hat ein Tagesordnungspunkt ein oder mehrere Unterpunkte, so können Sie bei
Klicken auf den Zusammenfassungs-Button |projector-summary|, der sich sowohl
auf dem Dashboard als auch im Tagesordnungsmenü rechts neben dem Eintrag
befindet, eine Zusammenfassung der Unterpunkte für jenen projizieren lassen.

.. |projector-summary| image:: ../_images/projector-summary.png

Bei einem Klick auf den Glocken-Button |bell| auf dem Dashboard oder auf der
Tagesordnungsseite wird die Rednerliste für den jeweiligen Eintrag auf der
Folie dargestellt.

.. |bell| image:: ../_images/bell.png

Zusätzlich zu allen bereits genannten Anzeigemöglichkeiten kann auf dem
Dashboard eine Einblendung der Rednerliste eingestellt werden. Aktivieren
Sie diese, wenn Sie auf den Kästchen-Button |checkbox| klicken. Die in einem
grauen Rahmen, rechts unten auf der Folie angezeigte Rednerliste,
visualisiert die letzten, den aktuellen (hervorgehoben) und die nächsten (fünf)
Redner. Die Einblendung erscheint nur auf Folien von Tagesordnungspunkten.

.. |checkbox| image:: ../_images/checkbox.png

.. image:: ../_images/Platzhalter.png
   :class: screenshot

.. Projektorbild mit Einblendung Rednerliste (ein alter, ein aktueller, 5 neue Redner)


Die Rednerliste verwalten
-------------------------

OpenSlides verfügt bei jedem Tagesordnungseintrag über eine
Rednerlistenfunktion.

Um eine Rednerliste zu bearbeiten, klicken Sie auf dem Dashboard oder im
Tagesordnungsmenü auf den jeweiligen Tagesordnungspunkt.

Jeder Teilnehmer hat die Möglichkeit, sich selbst auf eine Rednerliste zu
setzen, indem er entweder auf dem Dashboard im Widget „Rednerliste“ auf den
Button „Auf die aktuelle Rednerliste setzen“ |microphone| oder auf der Seite
zur Bearbeitung der Rednerliste auf den Button „Setze mich auf die Liste“
|microphone| klickt. Dort kann er sich ebenfalls selbst wieder austragen. Als
Administrator haben Sie zudem das Recht, weitere Teilnehmer und
Teilnehmerinnen auf die Rednerliste zu setzen. Hierfür wählen Sie aus der
Liste der bereits eingetragenen Teilnehmer denjenigen aus, der zur
Rednerliste hinzugefügt werden soll, und bestätigen mit einem Klick auf das
blaue Häkchen Ihre Auswahl. Die Teilnehmer werden dann nacheinander unter
„Nächste Redner“ aufgelistet. Wenn die Rednerliste geschlossen ist (Button
„Liste schließen“), kann sich kein Teilnehmer mehr selbst auf die Liste
setzen.

Um die Reihenfolge von Rednern zu ändern, verschieben Sie sie mit der Maus
an die gewünschte Position. Bestätigen Sie danach Ihre Änderungen.

.. image:: ../_images/Platzhalter.png
   :class: screenshot

.. Rednerliste mit einigen Rednern, die verschoben wurden, mit Dialogfeld

Wenn eine Person mit ihrem Redebeitrag beginnt, klicken Sie auf den Button
„Rede beginnen“ |microphone|. Sie wird nun als aktueller Redner angezeigt.
Ist der Redebeitrag zu Ende, können Sie dies mit dem Button „Rede beenden“
|microphone| bestätigen oder direkt den nächsten Redner mit dem Button „Rede
beginnen“ |microphone| aufrufen.

.. |microphone| image:: ../_images/microphone.png

.. image:: ../_images/Platzhalter.png
   :class: screenshot

.. Rednerliste mit aktuellem redner und kommenden rednern

Auf dem Dashboard finden Sie im Widget „Rednerliste“ zwei weitere Buttons,
um den obersten Redner des aktuell ausgewählten Tagesordnungseintrags
aufzurufen beziehungsweise den aktuellen Redebeitrag dieses Punktes zu
beenden.

Die Einstellung, wie viele letzte Redner projiziert werden sollen, finden
Sie im Menüpunkt „Konfiguration“ in der oberen Leiste unter „Tagesordnung“.

.. image:: ../_images/Platzhalter.png
   :class: screenshot

.. Konfiguration der Tagesordnung


CSV-Export der Rednerlisten
---------------------------

Am Ende Ihrer Veranstaltung können Sie sämtliche Rednerlisten mit den
jeweiligen Redezeiten als CSV-Datei exportieren. Sie benötigen dazu das
Plugin `„CSV Export Plugin for OpenSlides“`__.

__ http://openslides.org


Tagesordnung drucken
--------------------

Auf der Übersichtsseite der Tagesordnung können Sie die gesamte Tagesordnung
mit allen Unterpunkten (ohne organisatorische Einträge) als PDF-Datei
abrufen. Klicken Sie hierfür oben rechts auf „PDF“ |printer|.

.. |printer| image:: ../_images/printer.png
