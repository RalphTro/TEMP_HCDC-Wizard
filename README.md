# GS1 AI Decision Tree Wizard 

## Background
Taking the example of the decision tree in the latest finding of the GS1 Architecture Group, this repo represents an experiment how GS1 could make static decision trees into interactive, multi-language web apps. 

## Access
[Interactive Wizard Tool](https://ralphtro.github.io/TEMP_HCDC-Wizard/)

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
