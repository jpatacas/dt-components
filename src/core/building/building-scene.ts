import * as OBC from "@thatopen/components";
import { type Building } from "../../types";
import { BuildingDatabase } from "./building-database";
import workerUrl from "@thatopen/fragments/dist/Worker/worker.mjs?worker&url";
import { modelCache } from "./model-cache";

export class BuildingScene {
  private components: OBC.Components;
  private world!: OBC.World;
  private ifcLoader!: OBC.IfcLoader;
  private fragments!: OBC.FragmentsManager;

  private database = new BuildingDatabase();

  private disposed = false;

  constructor(
    private container: HTMLDivElement,
    private building: Building,
  ) {
    this.components = new OBC.Components();
    //this.init();
  }

  hide() {
    this.container.style.display = "none";
  }

  show() {
    this.container.style.display = "block";
  }

  // --------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------

  async initialize() {
    await this.init();
  }

  private async init() {
    if (this.disposed) return;
    const worlds = this.components.get(OBC.Worlds);

    this.world = worlds.create<
      OBC.SimpleScene,
      OBC.OrthoPerspectiveCamera,
      OBC.SimpleRenderer
    >();

    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.scene.setup();
    this.world.scene.three.background = null;

    this.world.renderer = new OBC.SimpleRenderer(
      this.components,
      this.container,
    );

    this.world.camera = new OBC.OrthoPerspectiveCamera(this.components);

    await this?.world?.camera?.controls?.setLookAt(15, 10, 15, 0, 0, 0);

    this.components.init();

    if (this.disposed) return;

    this.components.get(OBC.Grids).create(this.world);

    // -----------------------------------------
    // IFC Loader
    // -----------------------------------------

    this.ifcLoader = this.components.get(OBC.IfcLoader);

    await this.ifcLoader.setup({
      autoSetWasm: false,
      wasm: {
        path: "/wasm/",
        absolute: false,
      },
    });

    // -----------------------------------------
    // Fragments Manager
    // -----------------------------------------

    this.fragments = this.components.get(OBC.FragmentsManager);
    this.fragments.init(workerUrl);

    // Update fragments when camera moves
    this?.world?.camera?.controls?.addEventListener("update", () => {
      this.fragments.core.update();
    });

    // When a model is loaded → attach to scene
    this.fragments.list.onItemSet.add(({ value: model }) => {
      model.useCamera(this.world.camera.three);
      this.world.scene.three.add(model.object);
      this.fragments.core.update(true);
    });

    // Prevent z-fighting
    this.fragments.core.models.materials.list.onItemSet.add(
      ({ value: material }) => {
        if (!("isLodMaterial" in material && material.isLodMaterial)) {
          material.polygonOffset = true;
          material.polygonOffsetUnits = 1;
          material.polygonOffsetFactor = Math.random();
        }
      },
    );

    // Load stored models
    await this.loadAllModels();
  }

  async loadIfc(file: File) {
    console.time("IFC conversion");

    const buffer = new Uint8Array(await file.arrayBuffer());

    const model = await this.ifcLoader.load(buffer, false, file.name);

    console.timeEnd("IFC conversion");

    return model;
  }

  private async loadAllModels() {
    console.time("loadAllModels");

    if (modelCache.has(this.building.uid)) {
      console.log(" LOADING FROM MEMORY CACHE");

      const cachedFiles = modelCache.get(this.building.uid);

      for (const file of cachedFiles) {
        await this.loadIfc(file);
      }

      console.timeEnd("loadAllModels");
      return;
    }

    console.log(" LOADING FROM INDEXEDDB");

    const files = await this.database.getModels(this.building);

    modelCache.set(this.building.uid, files);

    for (const file of files) {
      await this.loadIfc(file);
    }

    console.timeEnd("loadAllModels");
  }

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  dispose() {
    this.disposed = true;
    this.components.dispose();
  }
}
