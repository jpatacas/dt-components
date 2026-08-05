import { type User } from "firebase/auth";
import type { Building, BuildingDashboard, BuildingScenario, DistrictDashboard, Floorplan, Property } from "../types";

export interface State {
  sensorHistory: any;
  user: User | null;
  building: Building | null;
  dtMode: string; //or string?
  sensors: Sensor[];
  map?: any;
  floorplans: Floorplan[];
  properties: Property[];
  buildingDashboard: BuildingDashboard | null;
  buildingScenario: BuildingScenario | null;
  // originalBuildingDashboard: BuildingDashboard | null;
  districtDashboard: DistrictDashboard | null;

  selectedSensor?: {
    name: string;
    timeseriesId: string;
    unit?: string;
  };

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
  properties: [],
  sensorHistory: [],
  buildingDashboard: null,
  buildingScenario: null,
  // originalBuildingDashboard: null,
  districtDashboard: null
};
