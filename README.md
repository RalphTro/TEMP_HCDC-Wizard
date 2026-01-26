# GS1 AI Decision Tree — Wizard (Static)

This is a small, dependency-free static web project.

## Run locally
- Open the folder in VS Code
- Start **Live Server**
- Open `index.html`.

The wizard loads `diagram.json` via `fetch()`, so it must run from a web server.

## Language
- Use the dropdown (top right)
- or add `?lang=de` / `?lang=es` to the URL.

Language is persisted in `localStorage` under `wizardLocale`.

## Model
- `diagram.json` contains nodes and i18n strings.
- Node types: `start`, `decision`, `process`, `result`.
- Decision nodes use `outcomes` with `label` (i18n key) and `next`.

## Notes
This project includes basic error handling: if `diagram.json` fails to load, the UI will show an error card.
