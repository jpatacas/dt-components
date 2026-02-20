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
  icon: any;
  action: (...args: any) => void;
}
