import { type Building } from "../../types";
import { localModelStore } from "../db/local-model-store";

export class BuildingDatabase {

  async getModels(building: Building): Promise<File[]> {

    const files: File[] = [];

    for (const model of building.models) {

      if (!model.localKey) continue;

      const file = await localModelStore.getIFC(model.localKey);

      if (file) {
        files.push(file);
        console.log("Added IFC file");
      } else {
        console.warn("Model not found in IndexedDB:", model.localKey);
      }
    }

    return files;
  }
}