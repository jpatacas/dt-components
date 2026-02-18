import type { User } from "firebase/auth";
import { MapScene } from "./map-scene";

export const mapHandler = {
  viewer: null as MapScene | null,

  async start(container: HTMLDivElement, user: User) {
    if (!this.viewer) {
      console.log("map started");
      this.viewer = new MapScene(container);
      await this.viewer.loadBuildings(user)
    }
  },
  remove() {
    if (this.viewer) {
      console.log("map removed");
      this.viewer.dispose();
      this.viewer = null;
    }
  },
    async addBuilding(user: User) {
    if (this.viewer) {
      await this.viewer.addBuilding(user);
    }
  },
};
