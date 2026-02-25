import { BuildingScene } from "./building-scene";
import { type Building } from "../../types";

export const buildingHandler = {
  viewer: null as BuildingScene | null,

  async start(container: HTMLDivElement, building: Building) {

  console.log("Creating new BuildingScene");
  // Always destroy old viewer
  if (this.viewer) {
    this.viewer.dispose();
    this.viewer = null;
  }

this.viewer = new BuildingScene(container, building);
await this.viewer.initialize();
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