.. raw:: latex

   \newpage

Wahlen durchführen
==================

In diesem Teil lernen Sie, wie Sie Wahlen auf Ihrer Versammlung mit
OpenSlides begleiten.


Konfiguration des Wahlsystems
--------------------------------

Zunächst können Sie im Menüpunkt „Konfiguration“ einige Einstellungen
vornehmen. Wechseln Sie zu diesem Menüpunkt und klicken Sie oben rechts auf
``Wahlen``. Stellen Sie die Anzahl der Stimmzettel wie folgt ein:

Anzahl der Stimmzettel (Vorauswahl):
  Verwende die folgende benutzerdefinierte Anzahl

Benutzerdefinierte Anzahl von Stimmzetteln:
  40

.. autoimage:: Tutorial_5_01.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 60
   :alt: Konfiguration Wahlen

*Bei Anträgen und Wahlen kann es unter Umständen vorkommen, dass
unterschiedlich viele Stimmzettel benötigt werden, weshalb hierfür jeweils
eigene Einstellungen vorzunehmen sind.*


Eingabe der anstehenden Wahlen/Wahlämter
----------------------------------------

Vor Veranstaltungsbeginn sind die anstehenden Wahlen vorzubereiten. Geben
Sie dazu im Menüpunkt „Wahlen“ rechts oben unter ``Neu``

.. autoimage:: Tutorial_5_02.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Wahl anlegen

ein Wahlamt wie folgt ein:

Name:
  Vorstand

Beschreibung:
  Der Vorstand vertritt den Verein nach außen.

Anzahl der zur Wahl stehenden Posten:
  3

.. autoimage:: Tutorial_5_03.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 60
   :alt: Formular Neue Wahl

Geben Sie auf die gleiche Weise ein weiteres Wahlamt wie folgt ein:

Name:
  Beirat

Beschreibung:
  Der Beirat unterstützt den Vorstand.

Anzahl der zur Wahl stehenden Posten:
  7

Kommentar für den Stimmzettel:
  Sie haben sieben Stimmen.

Die Wahlübersicht (Menüpunkt „Wahlen“) müsste nun so aussehen:

.. autoimage:: Tutorial_5_04.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Übersicht Wahlen


Durchführung einer Wahl während der Veranstaltung
-------------------------------------------------

Wenn der Vorsitzende während der Veranstaltung die Wahlen zum neuen
Vorstand aufruft, klicken Sie zunächst im Menüpunkt „Dashboard“ auf das
entsprechende Projektorsymbol vor der ersten Wahl.

.. autoimage:: Tutorial_5_05.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Widget Wahl

Wechseln Sie dann zur Wahlansicht, indem Sie auf den Titel der Wahl klicken.

Die Wahlansicht sieht dann wie folgt aus:

.. autoimage:: Tutorial_5_06.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Wahl im Detail

Es werden nun verschiedene Kandidaten vorgeschlagen, die Sie durch Auswahl
eines Teilnehmers und Klick auf den blauen Haken auf die Kandidatenliste
setzen können. Sie können nur Kandidaten auswählen, die auch im System
gespeichert sind.

.. autoimage:: Tutorial_5_07.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Wahl mit Kandidatenliste

*Das kleine Symbol neben dem Auswahlformular ist ein direkter Link zur
Eingabe eines neuen Teilnehmers. Dieser kann sehr nützlich sein, wenn
kurzfristig eine Person nominiert wird, die noch nicht ins System
eingetragen wurde.*

Steht die Kandidatenauswahl fest, ändern Sie rechts den Status der Wahl auf
„Im Wahlvorgang“. 

.. autoimage:: Tutorial_5_08.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Wahl im Wahlvorgang

Klicken Sie anschließend unten auf ``Neuer Wahlgang``, um einen ersten
Wahlgang anzulegen. Da es eine geheime Wahl ist und die Stimmzettel erst
ausgeteilt werden müssen, können Sie jetzt noch keine Wahlergebnisse
eintragen. Klicken Sie stattdessen auf ``Stimmzettel als PDF``.

.. autoimage:: Tutorial_5_09.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Stimmzettel als PDF drücken

OpenSlides liefert Ihnen daraufhin eine PDF-Datei, die Sie direkt
ausdrucken können. Die Stimmzettel können anschließend auseinander
geschnitten und verteilt werden.

.. autoimage:: Tutorial_5_10.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Wahlstimmzettel als PDF

*Bei mehrfachen Wahlen bietet sich der Einsatz einer Hebelschere an.*

Nach Auszählung der Stimmzettel tragen Sie die Ergebnisse des ersten
Wahlgangs in eben dieses Formular ein:

.. autoimage:: Tutorial_5_11.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Eingabe der Wahlergebnisse

Klicken Sie anschließend auf den roten Knopf bei dem ersten Wahlgang, um
die Wahlergebnisse auf dem Projektor zu veröffentlichen. Der Knopf erhält
einen weißen Haken.

.. autoimage:: Tutorial_5_12.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Wahlergebnisse veröffentlichen

Klicken Sie nun auf die grauen Haken vor Prof. Dr. Franziska Meyer, Luise Schmidt und
Dr. Hans Schulze, um diese als gewählt zu markieren.

.. autoimage:: Tutorial_5_13.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Wahlsieger festlegen

Ändern Sie rechts den Status der Wahl auf „Abgeschlossen“. Das Projektorbild
sieht nun wie folgt aus:

.. autoimage:: Tutorial_5_14.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Projektoransicht Wahl

Auf die gleiche Weise können Sie nun auch die zweite Wahl durchführen. Sie
werden feststellen, dass als Wahlmethode automatisch eine
Ja-Nein-Enthaltungs-Wahl bezüglich eines jeden Kandidaten ausgewählt wird,
wenn es weniger oder gleich viele Kandidaten wie Plätze gibt.

.. autoimage:: Tutorial_5_15.png
   :class: screenshot
   :scale-html: 75
   :scale-latex: 45
   :alt: Ja-Nein-Enthaltungs-Wahl

*Falls Sie nicht im Präsentationsmodus Single arbeiten, kann es sinnvoll
sein, den Drucker und die Hebelschere an der Seite oder am hinteren Ende
des Raums aufzustellen, damit die Sitzungsleitung ungestört fortfahren
kann, während Wahlzettel vorbereitet werden. Nötig ist dazu nur, dass der
Drucker an einen anderen Computer angeschlossen ist, der über das Netzwerk
auf den Server und damit auf OpenSlides zugreift. Im Präsentationsmodus
Single sollte der Drucker stets auch an den Rechner angeschlossen sein, mit
dem Sie arbeiten.*


Weiter geht es mit dem sechsten Teil des Tutorials: `Dateien hochladen und
anzeigen`__

.. __: Tutorial_6.html
