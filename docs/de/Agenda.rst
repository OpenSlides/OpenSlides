Tagesordnung
++++++++++++

Unter der Rubrik Tagesordnung können Sie einzelne Tagesordnungspunkte erstellen und verwalten.


Einen neuen Tagesordnungspunkt erstellen
----------------------------------------

Um einen neuen Punkt auf die Tagesordnung zu stellen, klicken Sie auf den rechts oben befindlichen blauen Button „Neu“. 

.. image:: ../_images/Platzhalter.png
   :class: screenshot

Es öffnet sich eine Seite, auf der Sie den neuen Eintrag bearbeiten können. Erforderliche Angaben für die Erstellung eines neuen Tagesordnungspunktes sind der „Titel“ und der „Typ“. Unterschieden wird bei den Typen nach einem „Tagesordnungseintrag“ für inhaltliche Themen und einem „Organisatorischen Eintrag“, der die Sitzung strukturiert. Ein „Organisatorischer Eintrag“ kann beispielsweise eine „Pause“ sein. Dieser wird bei der Dauer der Sitzung mit einberechnet, ist für die Benutzer auf der Tagesordnung aber nicht sichtbar. Bei der Projektion der gesamten Tagesordnung oder einzelner Unterpunkte erscheint ein organisatorischer Eintrag ebenfalls nicht.

*Im Menüpunkt „Konfiguration“ in der oberen Leiste unter „Tagesordnung“ können Sie die genaue Anfangszeit Ihrer Veranstaltung eingeben. OpenSlides ermittelt dann das rechnerische Ende automatisch.*

Zusätzlich haben Sie die Möglichkeit unter dem „Titel“ einen „Text“ einzufügen, der auf dem Projektor erscheinen soll. Einträge im Feld „Kommentar“ sind nur für die Versammlungsleitung sichtbar. 

Die Bearbeitung des Feldes „Elternelement“ dient der `Strukturierung von Tagesordnungspunkten`_.

Unter der Rubrik „Dauer“ können Sie die geplante Dauer des Tagesordnungspunktes im Format „hh:mm“ (Stunden:Minuten) angeben. Auf der Übersichtsseite der Tagesordnung werden alle eingegebenen Zeiten summiert und visualisiert.

Schließlich haben Sie noch die Möglichkeit, die „Rednerliste“ als geschlossen zu markieren. Dies kann sinnvoll sein, wenn beispielweise ein Tagesordnungspunkt vorhanden ist, zu dem nicht gesprochen werden soll. Somit wird verhindert, dass sich ein Teilnehmer/eine Teilnehmerin auf die Rednerliste setzen kann.

Klicken Sie „Speichern“ oder, wenn Sie den Eintrag gleich weiter bearbeiten wollen, „Übernehmen“.


Strukturierung von Tagesordnungspunkten
---------------------------------------

Die Strukturierung von Tagesordnungspunkten kann man direkt bei der Erstellung eines neuen Tagesordnungspunktes oder auf der Übersichtsseite der Tagesordnung vornehmen.

Bei der Erstellung eines neuen Tagesordnungspunktes dient die Rubrik „Elternelement“ der Strukturierung. Sobald ein oder mehrere Tagesordnungspunkte vorhanden sind, kann beim Eintrag eines neuen entschieden werden, ob dieser ein Unterpunkt eines bereits eingetragenenen werden soll. Der neue Eintrag wird dann ein sogenanntes Kind-Element zu einem schon existierenden Eltern-Element. Wenn kein Punkt ausgewählt wird (gestrichelte Linie), rangiert er auf der obersten Ebene. Klicken Sie in jedem Fall abschließend auf „Speichern“, um das Eingetragene zu sichern.

Eine andere Möglichkeit der Strukturierung von Tagesordnungspunkten besteht darin, auf der Übersichtsseite des Menüs Tagesordnung die einzelnen Einträge mit der Maus horizontal und vertikal an die gewünschte Position zu verschieben. Die geänderte Reihenfolge muss am Ende bestätigt werden.

.. image:: ../_images/Platzhalter.png
   :class: screenshot


Projizierung
------------

Für das Projizieren von Tagesordnungspunkten und Rednerlisten nutzt OpenSlides verschiedene Buttons mit Symbolen.

Um die gesamte Tagesordnung anzuzeigen, klicken Sie entweder auf dem Dashboard auf den Projektor-Button |projector| vor dem Wort Tagesordnung oder auf der Tagesordnungsseite auf den Projektor-Button in der oberen Zeile rechts. Projiziert werden nur die Haupttagesordnungspunkte, nicht die Unterpunkte.

.. |projector| image:: ../_images/PlatzhalterIcon.png

.. image:: ../_images/Platzhalter.png
   :class: screenshot

Sie haben die Möglichkeit, auch einzelne Tagesordnungspunkte mit ihren dazugehörigen Texten anzeigen zu lassen. Nutzen Sie dafür den Projektor-Button, der sich auf dem Dashboard links neben den jeweiligen Einträgen befindet oder den, der auf der Tagesordnungsseite in der Tabelle „Aktionen“ rechts neben den Tagesordnungspunkten liegt. 

Hat ein Tagesordnungspunkt ein oder mehrere Unterpunkte, so können Sie bei Klicken auf den Zusammenfassungs-Button |projector-summary|, der sich auf dem Dashboard wie im Tagesordnungsmenü rechts neben dem Eintrag befindet, eine Zusammenfassung der Unterpunkte für jenen projizieren lassen.

.. |projector-summary| image:: ../_images/PlatzhalterIcon.png

Bei einem Klick auf den Glocken-Button |bell| auf dem Dashboard oder auf der Tagesordnungsübersichtsseite wird die Rednerliste für den jeweiligen Eintrag auf der Folie dargestellt.

.. |bell| image:: ../_images/PlatzhalterIcon.png

Zusätzlich zu allen bereits genannten Anzeigemöglichkeiten, kann auf dem Dashboard eine Einblendung der Rednerliste eingestellt werden. Aktivieren Sie diese, wenn Sie auf den Kästchen-Button |checkbox| klicken. Die in einem grauen Rahmen, rechts unten auf der Folie, angezeigte Rednerliste visualisiert die letzten, hervorgehoben den aktuellen und die nächsten fünf Redner. Die Einblendung erscheint nur auf den Folien der einzelnen Tagesordnungspunkte.

.. |checkbox| image:: ../_images/PlatzhalterIcon.png

.. image:: ../_images/Platzhalter.png
   :class: screenshot


Die Rednerliste verwalten
-------------------------

OpenSlides verfügt bei jedem Tagesordnungseintrag über eine Rednerlistenfunktion.

Um eine Rednerliste zu bearbeiten, klicken Sie auf dem Dashboard oder im Tagesordnungsmenü auf den jeweiligen Tagesordnungspunkt.

Jeder Teilnehmer hat die Möglichkeit, sich selbst auf eine Rednerliste zu setzen, indem er entweder auf dem Dashboard im Widget „Zur aktuellen Rednerliste“ auf den Button „Auf die aktuelle Rednerliste setzen“ |microphone| oder auf der Seite zur Bearbeitung der Rednerliste auf den Button „Setze mich auf die Liste“ klickt. Dort kann er sich ebenfalls selbst austragen. Als Administrator haben Sie zudem das Recht, weitere Teilnehmer und Teilnehmerinnen auf die Rednerliste zu setzen. Hierfür wählen Sie aus der Liste der bereits eingetragenen Teilnehmer denjenigen aus, der zur Rednerliste hinzugefügt werden soll, und bestätigen mit einem Klick auf das blaue Häkchen Ihre Auswahl. Die Teilnehmer werden dann nacheinander unter „Nächste Redner“ aufgelistet. Wenn die Rednerliste geschlossen ist (Button „Liste schließen“), kann sich kein Teilnehmer mehr selbst auf die Liste setzen.

Um die Reihenfolge von Rednern zu ändern, verschieben Sie sie mit der Maus an die gewünschte Position. Bestätigen Sie danach Ihre Änderungen.

.. image:: ../_images/Platzhalter.png
   :class: screenshot

Wenn eine Person mit ihrem Redebeitrag beginnt, klicken Sie auf den Button „Beginn der Rede“ |microphone|. Sie wird nun als aktueller Redner angezeigt. Ist der Redebeitrag zu Ende, können Sie dies mit dem Button „Ende der Rede“ |microphone| bestätigen oder direkt den nächsten Redner mit dem Button „Beginn der Rede“ |microphone| aufrufen.

.. |microphone| image:: ../_images/PlatzhalterIcon.png

.. image:: ../_images/Platzhalter.png
   :class: screenshot

Auf dem Dashboard finden Sie im Widget „Tagesordnung“ zwei weitere Buttons, um den obersten Redner des aktuell ausgewählten Tagesordnungseintrags aufzurufen beziehungsweise den aktuellen Redebeitrag dieses Punktes zu beenden.

.. image:: ../_images/Platzhalter.png
   :class: screenshot

Die Einstellung, wie viele letzte Redner projiziert werden sollen, finden Sie im Menüpunkt „Konfiguration“ in der oberen Leiste unter „Tagesordnung“.

.. image:: ../_images/Platzhalter.png
   :class: screenshot


CSV-Export der Rednerlisten
---------------------------

Am Ende Ihrer Veranstaltung können Sie sämtliche Rednerlisten mit den jeweiligen Redezeiten als CSV-Datei exportieren. Sie benötigen dazu das Plugin `„CSV Export Plugin for OpenSlides“`__.

__ http://openslides.org


Tagesordnung drucken
--------------------

Auf der Übersichtsseite können Sie die gesamte Tagesordnung mit allen Unterpunkten (ohne organisatorische Einträge) als PDF-Datei abrufen. Klicken Sie hierfür oben rechts auf „PDF“.
