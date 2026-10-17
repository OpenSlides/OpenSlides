# Stimmgewicht aufteilen

Auf Papier bekam eine Person mit Stimmgewicht 4 vier Stimmzettel – und konnte
z. B. 2× Ja, 1× Nein und 1× Enthaltung abgeben. Diese Patches bringen genau das
in OpenSlides.

## So sieht es aus

Bei einer elektronischen Abstimmung mit einer Option (Antrag, Einzelwahl,
Ja/Nein bzw. Ja/Nein/Enthaltung) erscheint unter den Stimmknöpfen
**„Stimmen aufteilen“** – aber nur, wenn Stimmgewichte in der Sitzung aktiviert
sind und die Person ein Stimmgewicht größer als 1 hat. Dann trägt die Person
ein, wie viel ihres Gewichts auf Ja, Nein und Enthaltung entfällt. Absenden
geht erst, wenn alles verteilt ist. Das gilt auch für übertragene Stimmen
(Delegationen).

Im Ergebnis zählt jeder Teil wie ein eigener Stimmzettel. Bei namentlichen
Abstimmungen zeigt die Einzelstimmen-Folie ein eigenes Symbol für
aufgeteilte Stimmen.

## Regeln (geprüft im Vote-Service)

- Nur wenn `users_enable_vote_weight` in der Sitzung aktiv ist.
- Die Teile müssen zusammen exakt das Stimmgewicht ergeben.
- Jeder Teil muss größer als 0 sein, höchstens 6 Nachkommastellen, max. 100 Teile.
- Jeder Teil wird wie eine normale Stimme validiert.

## API

Statt `value` wird `split` gesendet:

```json
{
  "user_id": 5,
  "split": [
    {"weight": "2", "value": {"12": "Y"}},
    {"weight": "1", "value": {"12": "N"}},
    {"weight": "1", "value": {"12": "A"}}
  ]
}
```

Das Protokoll funktioniert für jede Abstimmungsart (auch mit mehreren Optionen);
die Oberfläche bietet das Aufteilen vorerst nur für Abstimmungen mit einer
Option an.

## Anwenden

Die Änderungen betreffen die Submodule, die auf die offiziellen
OpenSlides-Repos zeigen. Deshalb liegen sie hier als Patches:

```sh
git submodule update --init
patches/stimmgewicht-split/apply.sh
```

Danach die Images von `openslides-vote-service`, `openslides-backend`,
`openslides-client` und `openslides-projector-service` neu bauen.

| Submodul | Änderung |
|---|---|
| `openslides-vote-service` | Nimmt `split` an, validiert und speichert es |
| `openslides-backend` | Zählt jeden Teil beim Beenden der Abstimmung als eigene Stimme |
| `openslides-client` | Oberfläche „Stimmen aufteilen“, Übersetzungen |
| `openslides-projector-service` | Symbol für aufgeteilte Stimmen auf der Einzelstimmen-Folie |
