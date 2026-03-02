import { BuildingScene } from "./building-scene";
import { type Building } from "../../types";

export const buildingHandler = {
  viewer: null as BuildingScene | null,
  currentBuilding: null as Building | null,

  async start(container: HTMLDivElement, building: Building) {
    console.log("Creating new BuildingScene");
    // Always destroy old viewer
    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
    }

    this.currentBuilding = building;
    this.viewer = new BuildingScene(container, building);
    await this.viewer.initialize();
  },

  async refreshModels(building: Building) {
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
};
