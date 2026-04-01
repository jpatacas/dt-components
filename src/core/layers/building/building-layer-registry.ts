import type { BuildingScene } from "../../building/building-scene";

export const buildingLayerRegistry: Record<string, any> = {
  occupancy: {
    id: "occupancy",

    async fetch() {
      // example
      return [
        { spaceName: "15", status: "occupied" },
        { spaceName: "6", status: "free" },
      ];
    },

    async add(scene: BuildingScene, data: any[]) {
      // use map with applyLayer
      //const map = await scene.getSpacesByData(data);

      // pipeline
      await scene.applyLayerWithColors(data);
    },

    async remove(scene: BuildingScene) {
      await scene.resetLayer();
    },
  },
};
