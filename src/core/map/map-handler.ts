import type { User } from "firebase/auth";
import { MapScene } from "./map-scene";
import type { Events } from "../../middleware/event-handler";

export const mapHandler = {
  viewer: null as MapScene | null,

  async start(container: HTMLDivElement, user: User, events: Events) {
    if (!this.viewer) {
      console.log("map started");
      this.viewer = new MapScene(container, events);
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
