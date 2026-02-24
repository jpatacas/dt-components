import { BuildingScene } from "./building-scene";
import { type Building } from "../../types";

export const buildingHandler = {
  viewer: null as BuildingScene | null,

  start(container: HTMLDivElement, building: Building) {
    if (!this.viewer) {
      this.viewer = new BuildingScene(container, building);
    }
  },

  remove() {
    if (this.viewer) {
      console.log("Building viewer removed!");
      this.viewer.dispose();
      this.viewer = null;
    }
  },

};