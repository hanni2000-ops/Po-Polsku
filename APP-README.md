# Pl-Vokabeltrainer

Lokale Web-App zum Lernen polnischer Vokabeln (Niveau A2) mit Fokus auf Verbkonjugation.

## Starten

```bash
cd vokabel-app
python3 -m http.server 8000 --bind 127.0.0.1
# Browser: http://127.0.0.1:8000
```

Die App läuft komplett lokal; Daten liegen im Browser (localStorage).
Alternativ genügt es, `index.html` direkt im Browser zu öffnen.

## Funktionen

- **Vokabeln**: jede Woche Polnisch + Deutsch eintragen (Woche z. B. „KW 45/2025“, polnische Erklärung, Beispielsatz, eigene Verbformen optional).
- **Üben – zwei Modi**:
  1. *Alle Vokabeln*, sortiert nach Übungshistorie (nie Geübtes zuerst, dann schwächste Quote, dann älteste Übung)
  2. *Nach Woche gefiltert*
- **Vier Übungstypen**:
  - Lückentext (Wort in Beispielsatz einsetzen oder Bedeutung wählen)
  - Zuordnen (polnisches Wort ↔ polnische Erklärung)
  - Eigenen Satz bilden (mit Korrektur, Endungen farbig markiert + Erklärung)
  - Konjugieren: Präsens, Präteritum, Futur (bei Verben mit „się“ bleibt „się“ unverändert)
- **Anweisungen und Antworten auf Polnisch**, deutsche Übersetzung per „DE“-Knopf (auf Nachfrage).
- Groß-/Kleinschreibung wird in Antworten ignoriert; polnische Buchstaben (ą, ć, ę …) optional (Einstellungen).
- **Geschlecht** einstellbar (Einstellungen) – wichtig fürs Präteritum: weiblich → „zrobiłam“, männlich → „zrobiłem“.
- **Statistik** pro Woche + schwächste Vokabeln.
- **Export/Import** als JSON, Beispieldaten (A2-Alltag) ladbar.

## Tests

```bash
node test-core.js   # 39 Prüfungen: Konjugation, sich-Verben, Wochen, Sortierung, Vergleich
```

## Dateien

- `index.html`, `style.css`, `app.js` – Oberfläche
- `core.js` – Konjugationslogik, Wochen, Sortierung (Browser + Node)
- `test-core.js` – Node-Tests
