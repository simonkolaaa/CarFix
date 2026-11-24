# CarFix · By Simon Kola

Showroom 3D con **sagome 3D reali 1-to-1 per 135 configurazioni**, **Intro WebGL (*CARFIX BY SIMON KOLA*)**, **Garage 3D ** (*Manuale / Automatico*, **Manutenzione 7 Categorie**, **Selettore Mods dinamico +CV/+Nm**), **Engine Bay Simulator** (*Vista Electude* + **Motore Cinematico 3D con pistoni, bielle, albero motore, camme e turbina in movimento per ogni architettura**), ed **Enciclopedia "Cerca una macchina"** con verdetti e consigli di Simon.

## Com'è fatto

```text
[Intro WebGL] --> [Home 3D Studio (Modelli Reali 1:1 + Telemetria & Wiki Live)]
                                       |
      +--------------------------------+--------------------------------+
      v                                v                                v
[Garage 3D (7 Cat + Mod Reali)] [Simulator Electude Fotorealistico] [Enciclopedia Wiki]
```

- **Sagome 3D Reali per Ogni Auto (`catalog.ts` + `sketchfabApi.ts`)**: Copertura completa di VAG (9 marchi), Stellantis (14 marchi), EU, USA e Giappone con mappatura 1-to-1 per ogni singolo modello.
- **Garage Pulito & Mod Advisor Dinamico (`GarageView.tsx`, `modAdvisor.ts`)**: Il selettore rapido e i consigli di preparazione si aggiornano in tempo reale in base all'auto selezionata con guadagni `+CV`, `+Nm`, `0–100` e piano tagliandi in **7 categorie**.
- **Simulator Electude Fotorealistico (`EngineBay3D.tsx`, `SimulatorView.tsx`)**: Vano motore ad alta definizione in vista dall'alto (con zoom ispezione, **puntali Rosso/Nero del Multimetro**, **OBD-II** e **Motore 3D Reale**) adattato a **Benzina**, **Diesel**, **Ibrido** ed **Elettrico**.
- **Wiki Motore Multi-Fonte (`WikiView.tsx`, `engineEncyclopedia.ts`, `vehicleWikiApi.ts`)**: Integra **Wikipedia IT/EN**, **NHTSA Recalls & Owner Complaints Live**, olio esatto, distribuzione, consumi reali, **checklist 5 controlli usato** e codici motore.

## Setup e sviluppo locale

Richiede **Node.js 22+** e **npm**.

```bash
npm install     # installa dipendenze
npm test        # esegue gli unit test Vitest (copertura 100% catalogo 3D, Wiki, Mod Advisor, 7-cat)
npm run dev     # avvia la demo locale Vite
npm run build   # compila TypeScript e genera ./dist per GitHub Pages
```
