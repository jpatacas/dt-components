import type { BuildingScene } from "../../building/building-scene";

export const temperatureLayer = {
  id: "temperature",

  async fetch(scene: BuildingScene) {
    return scene.getSensorLayer(
      "temperature",
      (value) => {
        const temp = Number(value);

        if (temp < 20) return "cold";
        if (temp > 24) return "hot";

        return "comfortable";
      }
    );
  },

  async add(scene: BuildingScene, data: any[]) {
    await scene.applyLayerWithColors(temperatureLayer.id, data);
  },

  async remove(scene: BuildingScene) {
    scene.clearLayer(temperatureLayer.id);
  },
};