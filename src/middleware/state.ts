import { type User } from "firebase/auth";
import type { Building, Floorplan } from "../types";

export interface State {
    user: User | null;
    building : Building | null;
    dtMode: string; //or string?
    sensors: Sensor[];
    map?: any;
    floorplans: Floorplan[];
}

export interface Sensor {
  name: string;
  lat: number;
  lon: number;
  broker: string;
}

export const initialState: State = {
    user: null,
    building: null,
    dtMode: "descriptive",
    sensors: [],
    floorplans: [],
}