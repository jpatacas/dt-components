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
    const center: [number, number] = [-0.139203, 51.499702];

    return {
      container,
      accessToken: MAPBOX_KEY,
      center: [-0.139203, 51.499702],
      zoom: 15,
      pitch: 60,
      bearing: -40,
      buildings: [],
    };
  }
}
