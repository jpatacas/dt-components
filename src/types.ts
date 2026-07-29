import type { BuildingScene } from "./core/building/building-scene";

export interface GisParameters {
  container: HTMLDivElement;
  accessToken: string;
  zoom: number;
  pitch: number;
  center: [number, number];
  bearing: number;
  buildings: Building[];
}

export interface Building {
  uid: string;
  userID: string;
  lat: number;
  lng: number;
  // energy: number;
  name: string;
  models: Model[];
  // documents: Document[];
}

export interface Model {
  name: string;
  id: string;
  localKey?: string; // reference to IndexedDB key
  size?: number;
}

export interface Document {
  name: string;
  id: string;
}

export interface LngLat {
  lng: number;
  lat: number;
}

export interface Tool {
  name: string;
  active?: boolean;
  icon: any;
  action: (...args: any) => void;
}

export interface Floorplan {
  name: string;
  id: string;
}

export interface Property {
  name: string;
  value: string;
  type?: any;
  unit?: any;
  timeseriesId?: any;
}

/**
 * UI-safe layer config (used by LayerSelector)
 */
export interface LayerConfig {
  id: string;
  label: string;
  group: string;

  // UI behaviour
  selection: "single" | "multi";

  // optional UI metadata
  description?: string;
  icon?: any;
}

/**
 * Full layer definition (used by MapScene / core)
 */
export interface MapLayerDefinition extends LayerConfig {
  /**
   * Optional data fetcher (API, Firebase, etc.)
   */
  fetch?: () => Promise<any>;

  /**
   * Add layer to map
   */
  add: (map: mapboxgl.Map, data?: any) => void;

  /**
   * Remove layer from map
   */
  remove: (map: mapboxgl.Map) => void;
}

export interface BuildingLayerDefinition extends LayerConfig {
  //fetch?: () => Promise<any>;
  fetch?: (scene: BuildingScene) => Promise<any>;

  add: (scene: BuildingScene, data?: any) => Promise<void>;
  remove: (scene: BuildingScene) => Promise<void>;
}

export interface BuildingAlert {
  room: string;
  metric: string;
  value: number;
  unit?: string;
  severity: "warning" | "critical";
  message: string;
}

export interface BuildingDashboard {
  rooms: number;
  totalRooms: number;
  monitoredRooms: number;

  occupiedRooms: number;
  unoccupiedRooms: number;
  occupancyRate: number;

  avgTemperature: number;
  avgHumidity: number;
  avgCO2: number;

  maxTemperature: number;
  minTemperature: number;

  maxHumidity: number;
  minHumidity: number;

  maxCO2: number;
  minCO2: number;

  alerts: number;
  alertList: BuildingAlert[];

  lastUpdated: Date;
  lastUpdatedText: string;

  comfortIndex: number;
  coveragePercentage: number;
  occupancyChange: number;
  sensorHealth: number;

  onlineSensors: number;
  offlineSensors: number;
  totalSensors: number;
}

export interface RoomInfo {
  modelId: string;
  localId: number;

  name: string;
  longName?: string;
  floor?: string;
  area?: number;

  occupancy?: number;
  occupied?: boolean;

  temperature?: number;
  humidity?: number;
  co2?: number;
  light?: number;
}

export interface SensorValue {
  value: number;
  lat: number;
  lng: number;
  name?: string;
}

// export interface SensorLocation {
//   lat: number;
//   lng: number;
//   name?: string;
// }

export interface DistrictAlert {
  sensor: string;
  metric: string;
  value: number;
  unit?: string;
  severity: "warning" | "critical";
  message: string;
}

export interface DistrictDashboard {
  totalSensors: number;
  monitoredSensors: number;
  sensorHealth: number;

  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;

  avgHumidity: number;
  minHumidity: number;
  maxHumidity: number;

  avgNO2: number;
  minNO2: number;
  maxNO2: number;

  avgPM25: number;
  minPM25: number;
  maxPM25: number;

  hottestLocation?: {
    lat: number;
    lng: number;
  };
  hottestLocationAddress?: string;

  coldestLocation?: {
    lat: number;
    lng: number;
  };
  coldestLocationAddress?: string;

  worstAirQualityLocation?: {
    lat: number;
    lng: number;
  };
  worstAirQualityLocationAddress?: string;

  alerts: number;
  alertList: DistrictAlert[];

  lastUpdated: Date;
  lastUpdatedText: string;
}

export interface UrbanSensor {
  Sensor_Name: string;
  Sensor_Centroid_Latitude: number;
  Sensor_Centroid_Longitude: number;

  values: Record<
    string,
    {
      Value: number;
      Unit?: string;
      Timestamp?: string;
    }
  >;
}
