import type { BuildingScene } from "../../building/building-scene";

export const spacesLayer = {
  id: "spaces",


  async add(scene: BuildingScene, data: any[]) {
    // use map with applyLayer
    //const map = await scene.getSpacesByData(data);

    // pipeline
    //reload scene??

    await scene.showOnlySpaces()
  },

  async remove(scene: BuildingScene) {
    await scene.resetLayer();
  },
};
