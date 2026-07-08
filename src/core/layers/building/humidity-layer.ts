import type { BuildingScene } from "../../building/building-scene";

export const humidityLayer = {
  id: "humidity",

  async fetch(scene: BuildingScene) {
    return scene.getSensorLayer(
      "humidity",
      (value) => {
        const humidity = Number(value);

        if (humidity < 30) return "dry";
        if (humidity > 60) return "humid";

        return "good";
      }
    );
  },

  async add(scene: BuildingScene, data: any[]) {
    await scene.applyLayerWithColors(humidityLayer.id, data);
  },

  async remove(scene: BuildingScene) {
    scene.clearLayer(humidityLayer.id);
  },
};