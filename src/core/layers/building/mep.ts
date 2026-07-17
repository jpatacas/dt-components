import type { BuildingScene } from "../../building/building-scene";

export const mepLayer = {
  id: "mep",

  async add(scene: BuildingScene, data: any[]) {
    await scene.showMEP();
  },

  async remove(scene: BuildingScene) {
    await scene.resetLayer();
  },
};
