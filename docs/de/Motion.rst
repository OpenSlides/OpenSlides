.. raw:: latex

   \newpage

Anträge
+++++++

Voreinstellungen
----------------

Bei OpenSlides können im Menüpunkt „Konfiguration“ in der oberen rechten
Leiste bei „Antrag“ einige Voreinstellungen zu den Anträgen vorgenommen
werden:

* Es kann eingestellt werden, dass Nutzer ohne Verwaltungsrechte, also die
  normalen Delegierten, keine Anträge einreichen können. Dies ist zum
  Beispiel sinnvoll, wenn es im Laufe der Versammlung einen Antragsschluss
  gibt.

* Es besteht die Option, eine Mindestanzahl von Unterstützern und
  Unterstützerinnen für einen Antrag manuell einzutragen. Als Vorauswahl ist
  die „0“ eingegeben, die das Unterstützersystem automatisch deaktiviert. Ist
  das Unterstützersystem aktiv, können die berechtigten Teilnehmer und
  Teilnehmerinnen Anträge unterstützen und werden bei dem jeweiligen Antrag
  mit aufgelistet.

* Beim nächsten Feld können Sie einstellen, ob Unterstützer wieder entfernt
  werden sollen, wenn der Antragsteller (während des Anfangsstatus) seinen
  Antrag nachträglich bearbeitet.

* Sie können eine Antragseinleitung notieren, die bei neuen Anträgen im
  Textfeld vorgeschlagen wird.

* Sie haben die Möglichkeit, die Anzahl der Stimmzettel entsprechend der
  Anzahl aller Delegierten, der Anzahl aller Teilnehmer und Teilnehmerinnen
  oder einer benutzerdefinierten Eingabe anzupassen. Dies ist für das
  Ausdrucken der Stimmzettel von Bedeutung. Auf einer Druckseite erscheinen
  immer acht Stimmzettel, daher ist diese Zahl voreingestellt.

* Sie können einen eigenen Titel und einen Einleitungstext für das
  PDF-Dokument formulieren.

* Sie können einstellen, ob in den PDF-Dokumenten die Absätze der
  Antragstexte nummeriert sein sollen.

* Es kann die Möglichkeit eingestellt werden, beim späteren Ändern von
  Anträgen die automatische Versionierung im Einzelfall ausnahmsweise zu
  deaktivieren. Dies kann sinnvoll sein, wenn Anträge nur redaktionell
  geändert werden, aber ansonsten Versionierung__ aktiv bleiben soll.

* Sie haben die Wahl zwischen zwei verschiedenen Arbeitsabläufen__, in die
  jeder neue Antrag eingestellt wird: dem einfachen und dem komplexen
  Arbeitsablauf. Der einfache Arbeitsablauf bietet keine Versionierung und
  nur wenige Status. Beim komplexen Arbeitsablauf stehen Ihnen viele Status
  zur Verfügung, bei denen zum Teil die `automatische Versionierung`__
  aktiviert ist.

* Um die Anträge im Vorfeld zu strukturieren, besteht die Möglichkeit, sie
  pro Sachgebiet zu nummerieren, sie fortlaufend, das heißt über die
  Sachgebiete hinweg, zu nummerieren oder manuell die Nummerierung für den
  Bezeichner zu setzen.

.. __: #versionierung
.. __: #arbeitsablauf-und-status
.. __: #versionierung

.. autoimage:: Motion_01.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 75
   :alt: Konfiguration Antrag


Strukturierung von Anträgen
---------------------------

Um bei OpenSlides die eingetragenen Anträge zu strukturieren, können Sie
zum einen das Hinzufügen von „Sachgebieten“, zum anderen die automatische
Nummerierung nutzen.


Sachgebiete
'''''''''''

Auf der Menüseite „Anträge“ finden Sie in der oberen rechten Leiste den
Button „Sachgebiete“. Nach Klicken auf diesen erscheint in der oberen
rechten Leiste „Neu“. Klicken Sie darauf und erstellen Sie ein selbst
gewähltes Sachgebiet, das Sie mit einer Präfixbezeichnung abkürzen können.
Speichern Sie Ihre Einträge. Sie können nachträglich Sachgebiete bearbeiten
und umbenennen, wenn Sie auf den Bearbeiten-Button |edit| rechts neben dem
eingetragenen Sachgebiet klicken.


Nummerierung
''''''''''''

OpenSlides nummeriert alle Anträge automatisch, je nachdem, welche
Voreinstellung__ Sie vorgenommen haben. Standardmäßig ist die automatische
Nummerierung aktiv. Beim einfachen Arbeitsablauf wird dann jeder neue
Antrag sofort mit einer neuen Nummer (einem neuen Bezeichner) versehen.
Beim komplexen Arbeitsablauf erfolgt die Nummerierung erst, wenn der Antrag
„zugelassen“, „zurückgezogen“ oder „verworfen“ wurde. Sie können die Nummer
beziehungsweise den Bezeichner nachträglich ändern, indem Sie einen Antrag
über den Bearbeiten-Button |edit| editieren.

.. __: #voreinstellungen


Erstellen eines neuen Antrags / Bearbeiten
------------------------------------------

Um einen neuen Antrag zu erstellen, gehen Sie unter dem Menüpunkt „Anträge“
in der oberen rechten Leiste auf „Neu“. Tragen Sie einen Titel und einen
Antragstext ein, formulieren Sie gegebenenfalls eine Begründung zum Antrag,
klicken Sie auf den oder die Antragsteller (drücken Sie ``Strg``, um
mehrere Personen zu markieren) und wählen Sie aus den bereits eingetragenen
Sachgebieten eines aus, oder wenn kein Sachgebiet gewünscht ist, die
gestrichelte Linie. Speichern Sie danach Ihre Eintragungen. Im einfachen
Arbeitsablauf gilt der Antrag im Status nun als „eingereicht“, im komplexen
Arbeitsablauf als „veröffentlicht“.

Für den Antragstext und die Begründung können Sie den WYSIWYG-Texteditor
verwenden.

Wenn Sie einen Antrag später über den Bearbeiten-Button |edit| editieren,
können Sie zusätzlich den bestehenden Arbeitsablauf des Antrags wechseln.
Treffen Sie in diesem Fall unter „Arbeitsablauf“ Ihre entsprechende Wahl.

Je nach Status wird ein Antrag beim nachträglichen Bearbeiten versioniert.


Arbeitsablauf und Status
------------------------

OpenSlides bietet zwei Arbeitsabläufe mit verschiedenen Status, in denen
sich ein Antrag befinden kann. Dabei können über den Kasten „Antrag
verwalten“ von einem bestimmten Status aus bestimmte andere Status
ausgewählt und angeklickt werden. Mit dem roten Button „Status
zurücksetzen“ können Sie auf den Ausgangsstatus zurückspringen.

.. autoimage:: Motion_02.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Antrag verwalten Buttons

Beim einfachen Arbeitsablauf kann bei der Verwaltung eines eingereichten
Antrags zwischen „angenommen“, „abgelehnt“ und „nicht entschieden“ gewählt
werden. Beim komplexen Arbeitsablauf ist der Antrag zunächst
„veröffentlicht“ und es besteht die Option, den Antrag „zuzulassen“,
„zurückzuziehen“ oder „als nicht zulässig zu verwerfen“. Ist der Antrag
„zugelassen“, kann danach gewählt werden, ob der Antrag „angenommen“,
„abgelehnt“, „zurückgezogen“, „vertagt“, „nicht befasst“, „in einen
Ausschuss verwiesen“ wird oder er eine „Review benötigt“.

In bestimmten Status können die Antragsteller den Antrag noch selbst
bearbeiten, in anderen ist dies gesperrt. Ebenso kann der Administrator in
bestimmten Status eine Abstimmung__ ausrufen, in anderen nicht. Ist das
Unterstützersystem aktiviert (siehe Voreinstellungen__), können Teilnehmer
einen Antrag nur im jeweiligen Anfangsstatus unterstützen.

.. __: #abstimmungen
.. __: #voreinstellungen

Es folgt eine Übersicht über die beiden Arbeitsabläufe mit allen Status.


Einfacher Arbeitsablauf
'''''''''''''''''''''''

.. autoimage:: Motion_03_1.png
   :class: screenshot
   :scale-html: 60
   :scale-latex: 80
   :alt: Einfacher Arbeitsablauf

.. table:: Einfacher Arbeitsablauf
   :class: workflow-table table-bordered table-striped

   +-------------------+-----------------+---------------+------------+---------------+---------------+
   | Status            | Antragsteller   | Unterstützung | Abstimmung | Automatische  | Automatischer |
   |                   | darf bearbeiten | möglich       | möglich    | Versionierung | Bezeichner    |
   +===================+=================+===============+============+===============+===============+
   | Eingereicht       |       Ja        |      Ja       |     Ja     |     Nein      |      Ja       |
   +-------------------+-----------------+---------------+------------+---------------+---------------+
   | Angenommen        |      Nein       |     Nein      |    Nein    |     Nein      |      Ja       |
   +-------------------+-----------------+---------------+------------+---------------+---------------+
   | Abgelehnt         |      Nein       |     Nein      |    Nein    |     Nein      |      Ja       |
   +-------------------+-----------------+---------------+------------+---------------+---------------+
   | Nicht entschieden |      Nein       |     Nein      |    Nein    |     Nein      |      Ja       |
   +-------------------+-----------------+---------------+------------+---------------+---------------+


Komplexer Arbeitsablauf
'''''''''''''''''''''''

.. autoimage:: Motion_03_2.png
   :class: screenshot
   :scale-html: 60
   :scale-latex: 80
   :alt: Komplexer Arbeitsablauf

.. table:: Komplexer Arbeitsablauf
   :class: workflow-table table-bordered table-striped

   +---------------------+-----------------+---------------+------------+---------------+------------------------+---------------+
   | Status              | Antragsteller   | Unterstützung | Abstimmung | Automatische  | Neue Version wird      | Automatischer |
   |                     | darf bearbeiten | möglich       | möglich    | Versionierung | automatisch zugelassen | Bezeichner    |
   +=====================+=================+===============+============+===============+========================+===============+
   | Veröffentlicht      |       Ja        |      Ja       |    Nein    |     Nein      |           –            |    Nein       |
   +---------------------+-----------------+---------------+------------+---------------+------------------------+---------------+
   | Zugelassen          |       Ja        |     Nein      |     Ja     |      Ja       |          Nein          |     Ja        |
   +---------------------+-----------------+---------------+------------+---------------+------------------------+---------------+
   | Alle anderen Status |      Nein       |     Nein      |    Nein    |      Ja       |           Ja           |     Ja        |
   | des Arbeitsablaufs  |                 |               |            |               |                        |               |
   +---------------------+-----------------+---------------+------------+---------------+------------------------+---------------+


Experteneinstellung
'''''''''''''''''''

Es kann eingestellt werden, dass ein Antrag in einem bestimmten Status nur
für bestimmte Benutzer sichtbar ist. Die Anpassung kann vor dem ersten
Anlegen der Datenbank in der Datei ``openslides/motion/signals.py`` in der
Funktion ``create_builtin_workflows()`` erfolgen: Dazu beim gewünschten
Status beispielsweise die Zeile
``required_permission_to_see='motion.can_manage_motion',`` einfügen. Die
Anpassung kann aber auch bei bestehender Datenbank erfolgen: Dazu mit einem
entsprechenden Tool direkt auf die Datenbank zugreifen und beim gewünschten
Status das Feld ``required_permission_to_see`` beispielsweise mit der
Zeichenkette ``motion.can_manage_motion`` überschreiben.


Versionierung
-------------

OpenSlides versioniert Ihre Anträge, wenn sich der Antrag im komplexen
Arbeitsablauf und nicht mehr im Status „veröffentlicht“ befindet. Jedes
Mal, wenn der Antrag bearbeitet wird, legt OpenSlides eine neue
Antragsversion an. Sie können auf der Antragsseite mehrere Versionen
miteinander vergleichen. Wählen Sie dazu je einen Knopf links und rechts
aus und klicken Sie auf den Button „Unterschied“.

.. autoimage:: Motion_04.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Antrag mit Versionshistorie

Nur eine der Versionen eines Antrags gilt in OpenSlides als zugelassene
Version. Diese wird auf dem Projektor angezeigt und in der Antragsseite mit
einem grünen Haken markiert. Klicken Sie auf einen grauen Haken-Button, um
eine andere Version zuzulassen. Hierbei müssen Sie den entsprechenden
Dialog mit „Ja“ bestätigen.

Wenn Sie (bei entsprechender Voreinstellung__) einen Antrag
bearbeiten, haben Sie mit dem Haken „Keine neue Version erzeugen“ die
Möglichkeit, die ansonsten erfolgende Versionierung im Einzelfall
ausnahmsweise zu umgehen. Dies kann sinnvoll sein, wenn Sie einen Antrag
nur redaktionell (trivial) ändern wollen.

.. __: #voreinstellungen

Im einfachen Arbeitsablauf ist das Versionierungssystem deaktiviert.


Projizierung
------------

Um einen Antrag anzuzeigen, klicken Sie entweder auf dem Dashboard im Widget
„Anträge“ auf den Projektor-Button |projector| vor dem Antrag oder auf der
Seite eines Antrags auf den Projektor-Button in der oberen Zeile rechts.

.. |projector| image:: ../_images/projector.png

.. autoimage:: Motion_05.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Projektoransicht Antrag

Zu jedem Antrag können Sie über einen Link („Neuer Tagesordnungseintrag“)
in der oberen Leiste des betreffenden Antrags („Mehr Aktionen“) auch einen
eigenen Eintrag in der Tagesordnung erstellen, der direkt mit der
Antragsfolie verknüpft ist. Dies empfiehlt sich, wenn ein einzelner Antrag
an einer bestimmten Stelle der Tagesordnung behandelt werden und dazu eine
Rednerliste verwendet soll.


Abstimmungen
------------

Ruft der Versammlungsleiter eine Abstimmung über einen Antrag aus, können
Sie diese mit dem Button „Neue Abstimmung“ auf der betreffenden
Antragsseite (im Kasten rechts) in OpenSlides aufnehmen. Tragen Sie die
entsprechenden Abstimmungsergebnisse in die Tabelle ein. Wenn Sie ``-1``
eintragen, wird das Wort „Mehrheit“ ausgegeben. ``-2`` steht für „Nicht
erfasst“. Sollten Sie bei den abgegebenen Stimmen einen Wert eintragen,
berechnet OpenSlides automatisch die prozentualen Anteile der übrigen
Stimmzahlen. Klicken Sie am Ende auf ``Speichern`` oder ``Übernehmen``.

.. autoimage:: Motion_06.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 60
   :alt: Eingabe des Abstimmungsergebnisses

In der Abstimmungsansicht können Sie außerdem eventuell benötigte
Abstimmungszettel als PDF |printer| abrufen. Nachträglich können Sie
Abstimmungsergebnisse eingeben oder korrigieren, indem Sie auf der
Antragsseite neben der Abstimmung auf den Bearbeiten-Button |edit| klicken.

.. |edit| image:: ../_images/pencil.png


CSV-Import von Anträgen
-----------------------

OpenSlides bietet die Möglichkeit, vorbereitete Anträge im CSV-Format zu
importieren. Klicken Sie dazu auf der Antragsübersichtsseite oben rechts auf
„Importieren“. Hier können Sie auswählen, in welcher Datei Ihre Anträge
liegen, ob bereits existierende Anträge mit identischem Bezeichner
(Antragsnummer) überschrieben oder ignoriert werden sollen und welche
Person als Antragsteller eingetragen werden soll, falls die CSV-Datei in
einer Zeile keinen gültigen Antragsteller enthält. Die weiteren Hinweise
auf der Import-Seite müssen beachtet werden.

.. autoimage:: Motion_07.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: CSV-Import


PDF
---

Sie können schließlich einen einzelnen Antrag oder alle Anträge als
PDF-Datei abrufen. Klicken Sie hierfür auf den jeweiligen PDF-Button
|printer| auf der Antragsübersichtsseite oben rechts oder in der
Antragstabelle hinten.

.. |printer| image:: ../_images/printer.png
