import type { User } from "firebase/auth";
import { MapScene } from "./map-scene";

export const mapHandler = {
  viewer: null as MapScene | null,

  start(container: HTMLDivElement) {
    if (!this.viewer) {
      console.log("map started");
      this.viewer = new MapScene(container);
    }
  },
  remove() {
    if (this.viewer) {
      console.log("map removed");
      this.viewer.dispose();
      this.viewer = null;
    }
  },
  addBuilding(user: User) {
    if (this.viewer) {
      this.viewer.addBuilding(user);
    }
  },
};
