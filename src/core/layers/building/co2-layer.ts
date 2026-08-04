import type { BuildingScene } from "../../building/building-scene";

export const co2Layer = {
  id: "co2",

  async fetch(scene: BuildingScene) {
    return scene.getSensorLayer(
      "co2",
      (value) => {
        const co2 = Number(value);

        if (co2 < 800) return "good";
        if (co2 < 1000) return "moderate";

        return "poor";
      }
    );
  },

  async add(scene: BuildingScene, data: any[]) {
    await scene.applyLayerWithColors(co2Layer.id, data);
  },

  async remove(scene: BuildingScene) {
    scene.clearLayer(co2Layer.id);
  },
};