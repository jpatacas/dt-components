import * as MAPBOX from "mapbox-gl";
import { MAPBOX_KEY } from "../../config";
import type { Building, GisParameters, LngLat } from "../../types";
import type { User } from "firebase/auth";
import { MapDatabase } from "./map-database";
import type { Events } from "../../middleware/event-handler";

export class MapScene {
  private map!: MAPBOX.Map;
  private readonly style = "mapbox://styles/mapbox/light-v11";

  private clickedCoordinates: LngLat = { lat: 0, lng: 0 };
  private buildings: Building[] = [];

  private database = new MapDatabase();
  //private unsubscribe?: () => void;
  private mapLoaded = false;

  private ready!: Promise<void>;
  private resolveReady!: () => void;

  private events: Events;

  constructor(container: HTMLDivElement, events: Events) {
    this.events = events;
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });

    const config = this.getConfig(container);
    this.initializeMap(config);
  }

  dispose() {
    if (this.map) {
      this.map.remove();
    }
    this.buildings = [];
  }

  // ----------------------------------
  // Initialization
  // ----------------------------------

  private initializeMap(config: GisParameters) {
    this.map = new MAPBOX.Map({
      container: config.container,
      accessToken: MAPBOX_KEY,
      style: this.style,
      center: config.center,
      zoom: config.zoom,
      pitch: config.pitch,
      bearing: config.bearing,
      antialias: true,
    });

    this.map.on("load", () => {
      this.mapLoaded = true;
      this.setupBuildingSource();
      this.setupInteractions();
      this.resolveReady();
    });
  }

  // ----------------------------------
  // Firebase Sync
  // ----------------------------------

  public async loadBuildings(user: User) {
    await this.ready;

    const buildings = await this.database.getBuildings(user);
    this.buildings = buildings;
    this.updateBuildingSource();
  }

  public async addBuilding(user: User) {
    const { lat, lng } = this.clickedCoordinates;
    if (!lat || !lng) return;

    const building: Building = {
      uid: "",
      userID: user.uid,
      lat,
      lng,
      name: "",
      models: [],
    };

    // Save to Firebase
    const uid = await this.database.add(building);
    building.uid = uid;

    // Optimistic local update (optional if using subscribe)
    this.buildings.push(building);
    this.updateBuildingSource();
  }

  // ----------------------------------
  // Building Source + Layer
  // ----------------------------------

  private setupBuildingSource() {
    this.map.addSource("user-buildings", {
      type: "geojson",
      data: this.getBuildingGeoJSON(),
    });

    this.map.addSource("eraser", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              coordinates: [
                [
                  [-1.6257573096295346, 54.97388205609113],
                  [-1.6258416006236587, 54.97322952640323],
                  [-1.6245587315695218, 54.97372629953753],
                  [-1.6247190902005002, 54.97384075708487],
                  [-1.6257573096295346, 54.97388205609113],
                ],
              ],
              type: "Polygon",
            },
            id: 0,
          },
          {
            type: "Feature",
            properties: {},
            geometry: {
              coordinates: [
                [
                  [-1.625154043934117, 54.97235524220949],
                  [-1.6253046305668875, 54.97206233116623],
                  [-1.62425052413073, 54.97191347391583],
                  [-1.6241292182326106, 54.97221358877525],
                  [-1.625154043934117, 54.97235524220949],
                ],
              ],
              type: "Polygon",
            },
          },
          {
            type: "Feature",
            properties: {},
            geometry: {
              coordinates: [
                [
                  [-1.6231887225457058, 54.972619490508976],
                  [-1.6239268993347764, 54.97229739855709],
                  [-1.623802614466996, 54.972226062406094],
                  [-1.623576641980378, 54.97219147513576],
                  [-1.6229815810997934, 54.97246384908286],
                  [-1.6231887225457058, 54.972619490508976],
                ],
              ],
              type: "Polygon",
            },
          },
        ],
      },
    });

    this.map.addLayer({
      id: "user-buildings-layer",
      type: "circle",
      source: "user-buildings",
      paint: {
        "circle-radius": 6,
        "circle-color": "#0077ff",
      },
    });

    this.map.addLayer({
      id: "add-3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#aaa",

        // Use an 'interpolate' expression to
        // add a smooth transition effect to
        // the buildings as the user zooms in.
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "min_height"],
        ],
        "fill-extrusion-opacity": 0.6,
      },
    });
    this.map.addLayer({
      id: "eraser",
      type: "clip",
      source: "eraser",
      layout: {
        "clip-layer-types": ["symbol", "model"],
      },
      minzoom: 1,
    });
  }

  private updateBuildingSource() {
    if (!this.mapLoaded) return;

    const source = this.map.getSource("user-buildings") as MAPBOX.GeoJSONSource;
    if (source) {
      source.setData(this.getBuildingGeoJSON());
    }
  }

  // ----------------------------------
  // Interactions
  // ----------------------------------

  private setupInteractions() {
    // Right-click to store position
    this.map.on("contextmenu", (event) => {
      this.clickedCoordinates = {
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      };
    });

    // Click building icon
    this.map.on("click", "user-buildings-layer", (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const buildingId = feature.properties?.uid;
      if (!buildingId) return;

      const building = this.buildings.find((b) => b.uid === buildingId);
      if (!building) return;

      this.onBuildingSelected(building);
    });

    this.map.on("mouseenter", "user-buildings-layer", () => {
      this.map.getCanvas().style.cursor = "pointer";
    });

    this.map.on("mouseleave", "user-buildings-layer", () => {
      this.map.getCanvas().style.cursor = "";
    });
  }

  // ----------------------------------
  // GeoJSON Builder
  // ----------------------------------

  private getBuildingGeoJSON(): GeoJSON.FeatureCollection {
    return {
      type: "FeatureCollection",
      features: this.buildings.map((b) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [b.lng, b.lat],
        },
        properties: {
          uid: b.uid,
          userID: b.userID,
        },
      })),
    };
  }

  // ----------------------------------
  // Event Hook
  // ----------------------------------

  private onBuildingSelected(building: Building) {
    console.log("Building selected:", building);
    // Emit to router or global state
    this.events.trigger({
      type: "OPEN_BUILDING",
      payload: building,
    });
  }

  // ----------------------------------
  // Config
  // ----------------------------------

  private getConfig(container: HTMLDivElement): GisParameters {
    const center: [number, number] = [-1.6246925540216892, 54.972387334931994];

    return {
      container,
      accessToken: MAPBOX_KEY,
      center: center,
      zoom: 16.5,
      pitch: 45,
      bearing: 11,
      buildings: [],
    };
  }
}

// 54.972387334931994, -1.6246925540216892 Newcastle Helix
