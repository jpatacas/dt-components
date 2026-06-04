import type { BuildingLayerDefinition } from "../../../types";
import { buildingLayer } from "./building-layer";
import {occupancyLayer} from "./occupancy-layer";
import { spacesLayer } from "./spaces-layer";

export const buildingLayerRegistry: Record<string, BuildingLayerDefinition> = {
  "occupancy": occupancyLayer,
  "building": buildingLayer,
  "spaces": spacesLayer
}