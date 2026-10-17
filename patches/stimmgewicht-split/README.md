# Stimmgewicht aufteilen

Auf Papier bekam eine Person mit Stimmgewicht 4 vier Stimmzettel und konnte
jeden davon anders ausfüllen. Diese Patches bringen genau das in OpenSlides –
für **Wahlen**. Bei **Anträgen** bleibt die Stimme unteilbar.

## So sieht es aus

Bei einer elektronischen Wahl erscheint unter den Stimmknöpfen
**„Stimmen aufteilen“**, wenn

- Stimmgewichte in der Sitzung aktiviert sind und
- die Person mehr als eine Stimme hat (bei uns 2, 3 oder 4).

Dann bekommt die Person einen **Stimmzettel pro Stimme**. Jeder Stimmzettel
wird wie gewohnt ausgefüllt: Ja bei Kandidierenden (bis zur erlaubten
Stimmenzahl) oder die generelle Enthaltung. Absenden geht erst, wenn jeder
Stimmzettel ausgefüllt ist. Das funktioniert auch für übertragene Stimmen.

Im Ergebnis zählt jeder Stimmzettel einzeln. Gleiche Stimmzettel werden beim
Senden zusammengefasst. Auf der Einzelstimmen-Folie (namentliche Wahl) zeigt
ein eigenes Symbol, dass jemand aufgeteilt hat.

## Regeln (geprüft im Vote-Service)

- Nur bei Wahlen. Bei Anträgen und sonstigen Abstimmungen lehnt der Server
  aufgeteilte Stimmen ab.
- Nur wenn `users_enable_vote_weight` in der Sitzung aktiv ist.
- Die Teile müssen zusammen exakt das Stimmgewicht ergeben.
- Jeder Teil muss größer als 0 sein, höchstens 6 Nachkommastellen, max. 100 Teile.
- Jeder Teil wird wie eine normale Stimme validiert, also z. B. mit der
  maximalen Stimmenzahl pro Stimmzettel.

Die Oberfläche bietet das Aufteilen bei ganzzahligen Stimmgewichten bis 10 an
und nicht bei Wahlen mit mehreren Stimmen pro Kandidat*in (Kumulieren).

## API

Statt `value` wird `split` gesendet. Beispiel für eine Person mit
Stimmgewicht 4 bei einer Wahl mit „Ja“ und genereller Enthaltung:

```json
{
  "user_id": 5,
  "split": [
    {"weight": "2", "value": {"12": 1, "13": 1}},
    {"weight": "1", "value": {"12": 1}},
    {"weight": "1", "value": "A"}
  ]
}
```

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
| `openslides-vote-service` | Nimmt `split` bei Wahlen an, validiert und speichert es |
| `openslides-backend` | Zählt jeden Teil beim Beenden der Wahl als eigene Stimme |
| `openslides-client` | Stimmzettel-Oberfläche „Stimmen aufteilen“, Übersetzungen |
| `openslides-projector-service` | Symbol für aufgeteilte Stimmen auf der Einzelstimmen-Folie |
