# ADR 0001: Architettura Local-First WebGL + API Pubbliche per GitHub Pages

* **Stato**: Approvato
* **Data**: 2026-11-24
* **Riferimento Wiki**: Archetipo F (`vocabe` / `MQ` — Web App React + TypeScript + Vite per GitHub Pages)

## Contesto e Problema

CarFix richiede uno Showroom 3D WebGL interattivo, un Garage personale con alert predittivi sui chilometri, una Wiki motori con richiami ufficiali, una guida Euro 0–7 e un filtro AI che blocchi il caricamento di immagini non-automobilistiche — il tutto pubblicabile gratuitamente su **GitHub Pages** (host statico senza backend Python o database server-side).

## Decisione

1. **Frontend React 19 + TypeScript + Vite + Three.js (`@react-three/fiber`, `@react-three/drei`)**:
   - Intro cinematografica WebGL dedicata (`CinematicGolfIntro.tsx`) che mostra un'hatchback stile VW Golf mentre sbuffa fumo dalle marmitte e parte via avvolgendo lo schermo nel fumo, smontando poi il proprio `<Canvas>` prima di montare lo `ShowroomCanvas` principale per evitare conflitti di contesti WebGL.
   - 7 archetipi procedurali scolpiti con vernice fisica clearcoat, pavimento riflettente, softbox studio e 4 hotspot 3D cliccabili.
2. **Esclusione tassativa brand cinesi (`src/core/vehicleRules.ts`)**:
   - Blocklist esplicita (`CHINESE_BRANDS_BLOCKLIST`) applicata su catalogo e ricerche (inclusa l'esclusione di Leapmotor dal perimetro Stellantis). Copertura completa dei 9 marchi VAG e dei 14 marchi Stellantis storici europei/americani, più selezione EU/US/JP.
3. **AI Car-Only Gatekeeper reale nel browser (`src/services/carImageGatekeeper.ts`)**:
   - Caricamento lazy di `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` direttamente nel browser dell'utente (zero API key segrete esposte su GitHub Pages, zero costi server). Approva solo `car`, `truck`, `bus`, `motorcycle` con confidenza `>= 0.42`.
4. **NHTSA Live API + Richiami EU Curati (`src/services/nhtsaApi.ts`)**:
   - Interrogazione live via `fetch` verso `https://api.nhtsa.gov/recalls/recallsByVehicle` con cache 24h in `localStorage` e merge con i richiami europei curati (es. *1.2 PureTech*, *1.5 BlueHDi*, *BMW N47*).
5. **Persistenza Local-First (`src/state/useCarFixStore.ts`)**:
   - Garage, modifiche, foto ridimensionate e upvote/commenti Community salvati in `localStorage` con export/import JSON.
