import { sensorLayer } from "./sensor-layer";
import { buildingLayer } from "./building-layer";
import { airQualityLayer } from "./air-quality-layer";
import type { LayerDefinition } from "../../types";
import { pm25Layer } from "./pm25-layer";
import { no2Layer } from "./no2-layer";

export const layerRegistry: Record<string, LayerDefinition> = {
  "sensors": sensorLayer,
  "buildings": buildingLayer,
  "aqi": airQualityLayer,
  "pm25": pm25Layer,
  "no2": no2Layer
};