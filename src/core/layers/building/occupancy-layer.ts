import type { BuildingScene } from "../../building/building-scene";

export const occupancyLayer = {
  id: "occupancy",

  async fetch(scene: BuildingScene) {
    return scene.getSensorLayer("occupancy", (value) => {
      const occupancy = Number(value);

      if (occupancy === 1) {
        return "occupied";
      }

      if (occupancy === 0) {
        return "free";
      }

      return "unknown";
    });
  },

  async add(scene: BuildingScene, data: any[]) {
    console.log("call applyLayerWithColors (occupancy filter)");

    await scene.applyLayerWithColors(occupancyLayer.id, data);
  },

  async remove(scene: BuildingScene) {
    scene.clearLayer(occupancyLayer.id);
  },
};
