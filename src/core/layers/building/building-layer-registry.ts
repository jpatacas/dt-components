import type { BuildingLayerDefinition } from "../../../types";
import { archLayer } from "./architectural";
import { buildingLayer } from "./building-layer";
import { co2Layer } from "./co2-layer";
import { humidityLayer } from "./humidity-layer";
import { mepLayer } from "./mep";
import {occupancyLayer} from "./occupancy-layer";
import { spacesLayer } from "./spaces-layer";
import { structLayer } from "./structural";
import { temperatureLayer } from "./temperature-layer";

export const buildingLayerRegistry: Record<string, BuildingLayerDefinition> = {
  "occupancy": occupancyLayer,
  "building": buildingLayer,
  "spaces": spacesLayer,
  "architectural" : archLayer,
  "structural": structLayer,
  "mep" : mepLayer,
  "building-temperature": temperatureLayer,
  "co2" : co2Layer,
  "humidity": humidityLayer
}