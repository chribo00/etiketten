# Etiketten

Offline Windows-App zum Generieren von Barcode-Etiketten aus DATANORM-Daten.

## Entwicklung

```bash
npm install
npm run dev
```

Der Preload-Code in `src/preload` wird dabei automatisch nach `src/preload/index.js` gebaut und von Electron geladen.

## Produktion

```bash
npm run dist
```

Die resultierende NSIS-Installationsdatei befindet sich im `dist`-Ordner.
