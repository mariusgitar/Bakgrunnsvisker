# AGENTS.md

## Prosjektoversikt
Bakgrunnsfjerner — intern kommunal webapp.
Brukeren laster opp et bilde, bakgrunnen fjernes klientsiden via ML, og resultatet lastes ned som PNG.

## Stack
- React + Vite
- Tailwind CSS
- @huggingface/transformers (ONNX, klientside inferens)
- Statisk deploy til GitHub Pages

## Arkitektur
- Ingen backend, ingen API-nøkler
- ML-inferens kjører i Web Worker for å ikke låse UI
- Modell: briaai/RMBG-1.4

## Filstruktur
src/
  components/      # React-komponenter
  workers/         # Web Workers
  utils/           # Hjelpefunksjoner
  assets/          # Statiske filer

## Konvensjoner
- Komponentfiler: PascalCase (f.eks. ImageDropzone.jsx)
- Workers: camelCase med suffiks (f.eks. bgRemovalWorker.js)
- Utils: camelCase (f.eks. canvasUtils.js)
- Norske brukervendte tekster, engelske variabelnavn og kommentarer
- Én komponent per fil
