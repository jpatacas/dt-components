import type { BuildingScene } from "../../building/building-scene";

export const archLayer = {
  id: "architectural",

  async add(scene: BuildingScene, data: any[]) {
    await scene.showArch();
  },

  async remove(scene: BuildingScene) {
    await scene.resetLayer();
  },
};
