import * as MAPBOX from "mapbox-gl";
import { MAPBOX_KEY } from "../../config";
import type {
  Building,
  GisParameters,
  LngLat,
  DistrictDashboard,
  DistrictAlert,
  UrbanSensor,
} from "../../types";
import type { User } from "firebase/auth";
import { MapDatabase } from "./map-database";
import type { Events } from "../../middleware/event-handler";
import { mapLayerRegistry } from "../layers/map/map-layer-registry";

export class MapScene {
  private map!: MAPBOX.Map;
  private readonly style = "mapbox://styles/mapbox/light-v11";

  private clickedCoordinates: LngLat = { lat: 0, lng: 0 };
  private buildings: Building[] = [];

  private database = new MapDatabase();
  //private unsubscribe?: () => void;
  //private mapLoaded = false;

  private ready!: Promise<void>;
  private resolveReady!: () => void;

  private events: Events;

  private activeLayers = new Set<string>();

  private sensorCache: UrbanSensor[] = [];

  private dashboard?: DistrictDashboard;

  public getDashboard() {
    return this.dashboard;
  }

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

    this.map.on("load", async () => {
      this.setupBuildingSource();
      this.setupInteractions();

      await this.loadUrbanObservatoryData();

      await this.buildDistrictDashboard();

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
    //this.updateBuildingSource();
    this.updateBuildingLayer();
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
    //this.updateBuildingSource();
    this.updateBuildingLayer();
  }

  // ----------------------------------
  // Building Source + Layer
  // ----------------------------------

  private setupBuildingSource() {
    // this.map.addSource("user-buildings", {
    //   type: "geojson",
    //   data: this.getBuildingGeoJSON(),
    // });

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

  private updateBuildingLayer() {
    const layer = mapLayerRegistry["buildings"]; //"user-buildings"?

    if (!layer) return;

    if (!this.activeLayers.has("buildings")) return;

    if ((layer as any).update) {
      (layer as any).update(this.map, this.buildings);
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

    // Click building icon - need to change this?
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
    const center: [number, number] = [-1.6246925540216892, 54.972387334931994]; //coordinates for Newcastle Helix district

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

  public async updateLayers(layerIds: string[]) {
    await this.ready;

    // Close any open popup
    document.querySelectorAll(".mapboxgl-popup").forEach((p) => p.remove());

    const next = new Set(layerIds.filter(Boolean)); //  remove undefined

    console.log("Selected layers:", layerIds);
    console.log("Registry keys:", Object.keys(mapLayerRegistry));

    // REMOVE old
    for (const id of this.activeLayers) {
      if (!next.has(id)) {
        const layer = mapLayerRegistry[id];
        if (layer) {
          layer.remove(this.map);
        }
      }
    }

    // ADD new
    for (const id of next) {
      if (!this.activeLayers.has(id)) {
        const layer = mapLayerRegistry[id];

        if (!layer) {
          console.warn(`Layer not registered: ${id}`);
          continue;
        }

        if (id === "buildings") {
          layer.add(this.map, this.buildings);
          continue;
        }

        if (this.sensorCache.length === 0) {
          await this.loadUrbanObservatoryData();
        }

        layer.add(this.map, this.sensorCache);
      }
    }

    this.activeLayers = next;
  }

  private async loadUrbanObservatoryData() {
    const base = "https://corsproxy.io/?https://api.v2.urbanobservatory.ac.uk";

    const [sensorResponse, readingResponse] = await Promise.all([
      fetch(`${base}/sensors/json?limit=-1`),
      fetch(`${base}/sensors/data/json`),
    ]);

    const sensorsJson = await sensorResponse.json();
    const readingsJson = await readingResponse.json();

    const sensors = sensorsJson.Sensors ?? [];
    const readings = readingsJson.Readings ?? [];

    //------------------------------------------------------------------
    // Group readings by sensor
    //------------------------------------------------------------------

    const sensorsPerVariable = new Map<string, Set<string>>();

    for (const reading of readings) {
      const variable = reading.Variable;

      if (!sensorsPerVariable.has(variable)) {
        sensorsPerVariable.set(variable, new Set());
      }

      sensorsPerVariable.get(variable)!.add(reading.Sensor_Name);
    }

    console.table(
      [...sensorsPerVariable.entries()].map(([variable, sensors]) => ({
        variable,
        sensors: sensors.size,
      })),
    );

    const readingMap = new Map<string, Record<string, any>>();

    for (const reading of readings) {
      let sensorValues = readingMap.get(reading.Sensor_Name);

      if (!sensorValues) {
        sensorValues = {};
        readingMap.set(reading.Sensor_Name, sensorValues);
      }

      const variable = (reading.Variable ?? "").toLowerCase();

      let key: string | undefined;

      if (variable.includes("temperature")) key = "Temperature";
      else if (variable.includes("humidity")) key = "Humidity";
      else if (variable.includes("pm2.5")) key = "PM2.5";
      else if (variable.includes("pm10")) key = "PM10";
      else if (variable.includes("no2")) key = "NO2";
      else if (variable.includes("noise")) key = "Noise";
      else if (variable.includes("co2")) key = "CO2";

      if (!key) continue;

      sensorValues[key] = {
        Value: Number(reading.Value),
        Unit: reading.Units ?? reading.Unit,
        Timestamp: reading.Timestamp,
      };
    }

    //------------------------------------------------------------------
    // Merge metadata + readings
    //------------------------------------------------------------------

    this.sensorCache = sensors.map((sensor: any) => ({
      ...sensor,

      values: readingMap.get(sensor.Sensor_Name) ?? {},
    }));

    console.log(`Loaded ${this.sensorCache.length} Urban Observatory sensors`);
  }

  private async buildDistrictDashboard() {
    const temperatures: number[] = [];
    const humidities: number[] = [];
    const no2: number[] = [];
    const pm25: number[] = [];

    const alertList: DistrictAlert[] = [];

    let hottest = -Infinity;
    let coldest = Infinity;

    let hottestLocation: { lat: number; lng: number } | undefined;
    let coldestLocation: { lat: number; lng: number } | undefined;

    let worstAirQuality = -Infinity;
    let worstAirQualityLocation: { lat: number; lng: number } | undefined;

    const variableCounts = new Map<string, number>();

    for (const sensor of this.sensorCache) {
      for (const key of Object.keys(sensor.values)) {
        variableCounts.set(key, (variableCounts.get(key) ?? 0) + 1);
      }
    }

    console.table([...variableCounts.entries()].sort());

    for (const sensor of this.sensorCache) {
      const values = sensor.values;

      //----------------------------------------------------------
      // Temperature
      //----------------------------------------------------------

      if (values["Temperature"]) {
        const t = values["Temperature"].Value;

        temperatures.push(t);

        if (t > hottest) {
          hottest = t;
          hottestLocation = {
            lat: sensor.Sensor_Centroid_Latitude,
            lng: sensor.Sensor_Centroid_Longitude,
          };
        }

        if (t < coldest) {
          coldest = t;
          coldestLocation = {
            lat: sensor.Sensor_Centroid_Latitude,
            lng: sensor.Sensor_Centroid_Longitude,
          };
        }

        if (t > 30) {
          alertList.push({
            sensor: sensor.Sensor_Name,
            metric: "Temperature",
            value: t,
            unit: "°C",
            severity: "critical",
            message: `Very high outdoor temperature (${t}°C)`,
          });
        }

        if (t < -5) {
          alertList.push({
            sensor: sensor.Sensor_Name,
            metric: "Temperature",
            value: t,
            unit: "°C",
            severity: "warning",
            message: `Very low outdoor temperature (${t}°C)`,
          });
        }
      }

      //----------------------------------------------------------
      // Humidity
      //----------------------------------------------------------

      if (values["Humidity"]) {
        const h = values["Humidity"].Value;

        humidities.push(h);

        if (h > 90) {
          alertList.push({
            sensor: sensor.Sensor_Name,
            metric: "Humidity",
            value: h,
            unit: "%",
            severity: "warning",
            message: `High humidity (${h}%)`,
          });
        }
      }

      //----------------------------------------------------------
      // NO2
      //----------------------------------------------------------

      if (values["NO2"]) {
        const n = values["NO2"].Value;

        no2.push(n);

        if (n > 200) {
          alertList.push({
            sensor: sensor.Sensor_Name,
            metric: "NO₂",
            value: n,
            unit: "µg/m³",
            severity: n > 400 ? "critical" : "warning",
            message: `Elevated NO₂ concentration`,
          });
        }
      }

      //----------------------------------------------------------
      // PM2.5
      //----------------------------------------------------------

      if (values["PM2.5"]) {
        const p = values["PM2.5"].Value;

        pm25.push(p);

        if (p > worstAirQuality) {
          worstAirQuality = p;

          worstAirQualityLocation = {
            lat: sensor.Sensor_Centroid_Latitude,
            lng: sensor.Sensor_Centroid_Longitude,
          };
        }

        if (p > 25) {
          alertList.push({
            sensor: sensor.Sensor_Name,
            metric: "PM2.5",
            value: p,
            unit: "µg/m³",
            severity: p > 50 ? "critical" : "warning",
            message: `Poor air quality (${p} µg/m³)`,
          });
        }
      }
    }

    //--------------------------------------------------------------
    // Statistics
    //--------------------------------------------------------------

    const average = (v: number[]) =>
      v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;

    const now = new Date();

    const [
      hottestLocationAddress,
      coldestLocationAddress,
      worstAirQualityLocationAddress,
    ] = await Promise.all([
      hottestLocation
        ? this.reverseGeocode(hottestLocation.lat, hottestLocation.lng)
        : Promise.resolve(""),

      coldestLocation
        ? this.reverseGeocode(coldestLocation.lat, coldestLocation.lng)
        : Promise.resolve(""),

      worstAirQualityLocation
        ? this.reverseGeocode(
            worstAirQualityLocation.lat,
            worstAirQualityLocation.lng,
          )
        : Promise.resolve(""),
    ]);

    this.dashboard = {
      totalSensors: this.sensorCache.length,

      monitoredSensors: this.sensorCache.filter(
        (s) => Object.keys(s.values).length > 0,
      ).length,

      sensorHealth:
        this.sensorCache.length > 0
          ? (this.sensorCache.filter((s) => Object.keys(s.values).length > 0)
              .length /
              this.sensorCache.length) *
            100
          : 0,

      avgTemperature: average(temperatures),
      minTemperature: temperatures.length ? Math.min(...temperatures) : 0,
      maxTemperature: temperatures.length ? Math.max(...temperatures) : 0,

      avgHumidity: average(humidities),
      minHumidity: humidities.length ? Math.min(...humidities) : 0,
      maxHumidity: humidities.length ? Math.max(...humidities) : 0,

      avgNO2: average(no2),
      minNO2: no2.length ? Math.min(...no2) : 0,
      maxNO2: no2.length ? Math.max(...no2) : 0,

      avgPM25: average(pm25),
      minPM25: pm25.length ? Math.min(...pm25) : 0,
      maxPM25: pm25.length ? Math.max(...pm25) : 0,

      hottestLocation,
      hottestLocationAddress,
      coldestLocation,
      coldestLocationAddress,
      worstAirQualityLocation,
      worstAirQualityLocationAddress,

      alerts: alertList.length,
      alertList,

      lastUpdated: now,
      lastUpdatedText: now.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "medium",
      }),
    };

    console.log(this.dashboard);

    this.events.trigger({
      type: "UPDATE_DISTRICT_DASHBOARD",
      payload: this.dashboard,
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi,place&limit=1&access_token=${MAPBOX_KEY}`,
      );

      const json = await response.json();

      if (json.features?.length) {
        return json.features[0].place_name;
      }

      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  public flyToLocation(lat: number, lng: number, title?: string) {
    this.map.flyTo({
      center: [lng, lat],
      zoom: 17,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });

    if (title) {
      // new mapboxgl.Popup()
      //   .setLngLat([lng, lat])
      //   .setHTML(`<strong>${title}</strong>`)
      //   .addTo(this.map);
      console.log(title);
    }
  }
}
