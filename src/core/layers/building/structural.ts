import type { BuildingScene } from "../../building/building-scene";

export const structLayer = {
  id: "structural",

  async add(scene: BuildingScene, data: any[]) {
    await scene.showStruct();
  },

  async remove(scene: BuildingScene) {
    await scene.resetLayer();
  },
};
