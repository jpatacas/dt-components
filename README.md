# Digital Twin Components

Digital Twin application providing the integration of BIM with other data sources such as GIS, energy data, etc. for the development of building and urban digital twins.

Main features:
- Manage projects by user based on location on world map
- IFC model storage using IndexedDB (add and delete multiple models for each building)
- IFC model loading using fragments, including local caching - Open BIM Components v3.3

Technologies used:
- Typescript
- React + vite
- Open BIM components v3.3
- Mapbox
- Firebase
- IndexedDB
- Material UI

## Setup

In the project directory, you can run:

### `npm run dev`

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Open BIM Components

Copy `web-ifc-mt.wasm` and `web-ifc.wasm` files to `public/wasm` folder

## Firebase and Mapbox configuration

- add a `config.js` file in `/src` with your `firebaseConfig` and `MAPBOX_KEY` data

- setup authentication in Firebase using google