import { type User } from "firebase/auth";
import type { Building } from "../types";

export interface State {
    user: User | null;
    building : Building | null;
    dtMode: string; //or string?
    sensors: Sensor[];
    map?: any;
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
    sensors: []
}