# Etiketten

Offline Windows-App zum Generieren von Barcode-Etiketten aus DATANORM-Daten.

## Entwicklung

```bash
npm install
npm run dev
```

Der Preload-Code in `src/preload.ts` wird dabei automatisch nach `src/main/preload.js` gebaut und von Electron geladen.

## Produktion

```bash
npm run dist
```

Die resultierende NSIS-Installationsdatei befindet sich im `dist`-Ordner.
