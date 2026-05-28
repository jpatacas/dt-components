import type { BuildingScene } from "../../building/building-scene";

export const buildingLayerRegistry: Record<string, any> = {
  occupancy: {
    id: "occupancy",

    async fetch() {
      // example
      return [
        // { spaceName: "15", status: "occupied" },

        { spaceName: "6", status: "unknown" },

        { spaceName: "3", status: "unknown" },
        { spaceName: "4", status: "unknown" },
        { spaceName: "5", status: "unknown" },
        { spaceName: "6", status: "unknown" },
        // { spaceName: "7", status: "free" },

        // { spaceName: "9", status: "free" },
        // { spaceName: "10", status: "layer" },

        { spaceName: "7050", status: "occupied" },
        { spaceName: "7051", status: "free" },
        { spaceName: "7052", status: "occupied" },
        { spaceName: "7020", status: "occupied" },
        { spaceName: "7004", status: "occupied" },
        { spaceName: "7007", status: "free" },
        { spaceName: "7008", status: "occupied" },
        { spaceName: "7001", status: "free" },
        { spaceName: "7005", status: "occupied" },
        { spaceName: "7002", status: "occupied" },
        { spaceName: "7006", status: "occupied" },
        { spaceName: "7016", status: "occupied" },
        { spaceName: "7017", status: "occupied" },
        { spaceName: "7019", status: "occupied" },
        { spaceName: "7013", status: "occupied" },

        { spaceName: "7010", status: "free" },
        { spaceName: "7009", status: "free" },
        { spaceName: "7011", status: "free" },
        { spaceName: "7003", status: "free" },
        { spaceName: "7012", status: "free" },
        { spaceName: "7013", status: "free" },
        { spaceName: "7023", status: "free" },
        { spaceName: "7025", status: "free" },
        { spaceName: "7026", status: "free" },
        { spaceName: "7021", status: "occupied" },
        { spaceName: "7022", status: "occupied" },
        { spaceName: "7024", status: "occupied" },
        { spaceName: "7027", status: "free" },
        { spaceName: "7028", status: "free" },
        { spaceName: "7029", status: "occupied" },
        { spaceName: "7030", status: "occupied" },
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
