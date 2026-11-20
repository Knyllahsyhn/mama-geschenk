# Post für Frau Müller

Geburtstagsgeschenk als Webseite: Mama scannt einen QR-Code, packt am Handy ein
Paket aus und sieht die leguano acasa mint in Größe 41, einen Brief und den
Lieferstatus. Die echten Hausschuhe kommen nach, sobald Größe 41 wieder lieferbar
ist.

Adresse: https://knyllahsyhn.github.io/mama-geschenk/

## Pflegen

- **Brief:** `brief.txt`. Absätze durch eine Leerzeile trennen. Der erste Absatz
  (Anrede) wird groß in Handschrift gesetzt, der letzte als Unterschrift.
- **Lieferstatus:** `status.json`. `aktuell` ist die Nummer der aktuellen
  Station, gezählt ab 0 (0 = Ausgesucht, 1 = Warten auf Größe 41, 2 = Bestellt,
  3 = Unterwegs, 4 = Angekommen). Bei 4 gibt es Konfetti. `aktualisiert` als
  Datum `JJJJ-MM-TT`, `notiz` ist der Text über der Strecke.

Nach einem Push braucht GitHub Pages ein bis zwei Minuten. Die Seite lädt Brief
und Status ohne Cache nach.

## Verhalten

- Wer einmal ausgepackt hat, landet beim nächsten Öffnen direkt bei den Schuhen
  (im Browser gespeichert). `?neu` an die Adresse hängen oder unten auf
  „Nochmal auspacken“ tippen, um von vorn zu beginnen.
- Nach 9 Sekunden ohne Zug am Streifen erscheint ein Link, der das Paket ohne
  Geste öffnet.

## QR-Code

`qr/qr.svg` und `qr/qr.png` (Fehlerkorrektur Stufe Q). Neu erzeugen:

    qrencode -l Q -m 2 -t SVG -o qr/qr.svg https://knyllahsyhn.github.io/mama-geschenk/
    qrencode -l Q -m 2 -s 24 -o qr/qr.png https://knyllahsyhn.github.io/mama-geschenk/

Produktfotos: leguano GmbH, nur für diesen privaten Zweck.
