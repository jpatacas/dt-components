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
export interface LayerDefinition extends LayerConfig {
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
