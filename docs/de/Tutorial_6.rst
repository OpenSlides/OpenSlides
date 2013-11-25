.. raw:: latex

   \newpage

Dateien hochladen und verwalten
===============================

In diesem Teil lernen Sie, wie Sie eigene Dateien, zum Beispiel Bilder, bei
OpenSlides hochladen und in den Projektor einbinden.


Hochladen von eigenen Dateien
-----------------------------

Wechseln Sie zum Menüpunkt „Dateien“ und klicken Sie oben rechts auf ``Neu``.

Laden Sie eine Datei hoch, indem Sie mit „Durchsuchen“ die Datei aus dem
Dateisystem ihres Computers auswählen. Wir unterstellen, dass der Dateiname
``bild.jpg`` lautet. Außerdem können Sie noch einen ergänzenden Titel
angeben.

.. autoimage:: Tutorial_6_01.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 60
   :alt: Formular Neue Datei

Die Datei ist nun auf den Server geladen und unter ihrem Namen auf der
Übersichtsseite des Menüpunkts „Dateien“ verlinkt. Um den Link kurzzeitig
für den gleich folgenden Schritt mit zu nehmen, klicken Sie mit der rechten
Maustaste auf den Titel und wählen Sie „Link-Adresse kopieren“ im Dialog
Ihres Browsers (getestet mit Firefox).


Bilddatei auf dem Projektor anzeigen
------------------------------------

Wenn Sie nun das Bild auf der Projektorleinwand sehen wollen, müssen Sie es
zunächst in eine Folie einbinden. Dazu bieten sich zum Beispiel die
benutzerdefinierten Folien auf dem Dashboard an. Wechseln Sie zum Menüpunkt
„Dashboard“ und klicken Sie im Fenster „Benutzerdefinierte Folien“ auf ``Neu``.

Geben Sie Titel und Text wie folgt ein:

Titel:
  Schönster Garten der Anlage

Text:
  <img src="/media/file/bild.jpg" />

Beachten Sie die richtige Schreibweise des Links im verwendeten HTML-Tag.
Der Link entspricht dem zuvor kopierten.

.. autoimage:: Tutorial_6_02.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 60
   :alt: Benutzerdefinierte Folie

Wenn Sie nun die benutzerdefinierte Folie mit Hilfe des Projektorsymbols
|projector| auswählen, wird das Bild auf dem Projektor angezeigt. Weitere
Feineinstellungen können Sie im HTML-Tag mit Style-Attributen vornehmen.
Falls beispielsweise das Bild nicht die passende Größe hat, können Sie
``style="width:80%;"`` verwenden.

.. autoimage:: Tutorial_6_03.png
   :class: screenshot
   :scale-html: 45
   :scale-latex: 80
   :alt: Projektor mit benutzerdefinierter Folie

.. |projector| image:: ../_images/projector.png


Weiter geht es mit dem letzten Teil des Tutorials: `Nach einer Veranstaltung`__

.. __: Tutorial_7.html
