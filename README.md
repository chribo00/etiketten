# Etiketten

Offline Windows-App zum Generieren von Barcode-Etiketten aus DATANORM-Daten.

## Entwicklung

### Entwicklung starten

```bash
npm install
npm run dev
```

Dabei startet Vite (Port 5173) und danach Electron. In der Konsole erscheinen getrennte Logs beider Prozesse.
Die Ansicht im Browser unter `http://localhost:5173` besitzt absichtlich keine Bridge und zeigt eine Warnleiste.
Der Preload-Code in `src/preload.ts` wird dabei automatisch nach `src/main/preload.js` gebaut und von Electron geladen.

### Tests

Vor dem Ausführen der Jest-Tests müssen die nativen `better-sqlite3`-Bindings für Node gebaut werden:

```bash
npm run rebuild:node
npm test
```

Nach den Tests kann mit `npm run rebuild:electron` wieder für die Electron-Laufzeit gebaut werden.

## Produktion

```bash
npm run dist
```

Die resultierende NSIS-Installationsdatei befindet sich im `dist`-Ordner.
