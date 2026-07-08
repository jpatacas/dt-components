import type { BuildingScene } from "../../building/building-scene";

export const buildingLayer = {
  id: "building",


  async add(scene: BuildingScene, data: any[]) {
    // use map with applyLayer
    //const map = await scene.getSpacesByData(data);

    // pipeline
    //reload scene??

    //await scene.showAll()
  },

  async remove(scene: BuildingScene) {
    await scene.resetLayer();
  },
};
