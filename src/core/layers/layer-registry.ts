import { sensorLayer } from "./sensor-layer";
//import { buildingLayer } from "./layers/building-layer";
import type { LayerDefinition } from "../../types";

export const layerRegistry: Record<string, LayerDefinition> = {
  sensors: sensorLayer,
  //buildings: buildingLayer,
};