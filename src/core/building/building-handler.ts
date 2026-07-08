import { BuildingScene } from "./building-scene";
import { type Building, type Floorplan } from "../../types";
import type { Events } from "../../middleware/event-handler";

export const buildingHandler = {
  viewer: null as BuildingScene | null,
  currentBuilding: null as Building | null,

  async start(container: HTMLDivElement, building: Building, events: Events) {
    console.log("Creating new BuildingScene");
    // Always destroy old viewer
    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
    }

    this.currentBuilding = building;
    this.viewer = new BuildingScene(container, building, events);
    await this.viewer.initialize();
    
    // reset layers when entering building
    this.viewer.updateLayers([]);
  },

  async refreshModels(building: Building, events: Events) {
    if (!this.viewer) return;
    if (!this.currentBuilding) return;

    // Only refresh if this building is open
    if (building.uid !== this.currentBuilding.uid) return;

    this.currentBuilding = building;

    await this.viewer.refreshModels(building);
  },

  remove() {
    if (this.viewer) {
      console.log("Building viewer removed!");
      //this.viewer.dispose();
      //this.viewer = null;
      this.viewer.hide();
    }
  },
  toggleFloorplan(active: boolean, floorplan?: Floorplan) {
    if (this.viewer) {
      this.viewer.toggleFloorplan(active, floorplan);
    }
  },
  updateLayers(layerIds: string[]) {
    if (!this.viewer) return;

    console.log("Building handler updating layers:", layerIds);

    this.viewer.updateLayers(layerIds);
  },

  async selectSensor(
  sensor: {
    name: string;
    timeseriesId: string;
    unit?: string;
  }
) {

  await this.viewer?.loadSensorHistory(
    sensor
  );

}
};
