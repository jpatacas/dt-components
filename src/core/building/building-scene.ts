import * as OBC from "@thatopen/components";
import { type Building } from "../../types";
import workerUrl from "@thatopen/fragments/dist/Worker/worker.mjs?worker&url";
import { localModelStore } from "../db/local-model-store";

export class BuildingScene {
  private components: OBC.Components;
  private world!: OBC.World;
  private ifcLoader!: OBC.IfcLoader;
  private fragments!: OBC.FragmentsManager;
  private disposed = false;

  constructor(
    private container: HTMLDivElement,
    private building: Building,
  ) {
    this.components = new OBC.Components();
  }

  // --------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------

  async initialize() {
    await this.init();
  }

  hide() {
    this.container.style.display = "none";
  }

  show() {
    this.container.style.display = "block";
  }

  dispose() {
    this.disposed = true;
    this.components.dispose();
  }

  // --------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------

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

    await this.world.camera.controls.setLookAt(15, 10, 15, 0, 0, 0);

    this.components.init();

    if (this.disposed) return;

    this.components.get(OBC.Grids).create(this.world);

    // -----------------------------------------
    // IFC LOADER (3.3)
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
    // FRAGMENTS MANAGER (3.3)
    // -----------------------------------------

    this.fragments = this.components.get(OBC.FragmentsManager);
    this.fragments.init(workerUrl);

    // Update fragments on camera movement
    this.world.camera.controls.addEventListener("update", () => {
      this.fragments.core.update();
    });

    // When fragment model is added
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

    // Load models
    await this.loadAllModels();
  }

  // --------------------------------------------------
  // MAIN LOAD LOGIC
  // --------------------------------------------------

  private async loadAllModels() {
    if (!this.building.models?.length) return;

    console.time("Total model loading");

    for (const model of this.building.models) {
      if (!model.localKey) continue;

      console.time(`Model ${model.localKey}`);

      const cachedFragments = await localModelStore.getFragments(
        model.localKey,
      );

      if (cachedFragments && cachedFragments.length > 0) {
        console.log("Loading fragments from cache:", model.localKey);

        await this.loadFragments(cachedFragments, model.localKey);
      } else {
        console.log("No fragment cache — converting IFC:", model.localKey);

        const file = await localModelStore.getIFC(model.localKey);

        if (!file) {
          console.warn("IFC file missing for:", model.localKey);
          continue;
        }

        await this.convertIfcAndCache(file, model.localKey);
      }

      console.timeEnd(`Model ${model.localKey}`);
    }

    console.timeEnd("Total model loading");
  }

  // --------------------------------------------------
  // IFC → FRAGMENTS → CACHE
  // --------------------------------------------------

  private async convertIfcAndCache(file: File, modelKey: string) {
    console.time(`IFC conversion ${modelKey}`);

    const buffer = new Uint8Array(await file.arrayBuffer());

    // Load IFC into scene (FragmentsManager will register it)
    const fragmentModel = await this.ifcLoader.load(buffer, false, file.name);

    // Export fragment buffer from loaded model
    const fragmentsBuffer = await fragmentModel.getBuffer(false);

    // Save fragment buffer per model
    await localModelStore.saveFragments(modelKey, [fragmentsBuffer]);

    console.timeEnd(`IFC conversion ${modelKey}`);
  }

  // --------------------------------------------------
  // LOAD FRAGMENTS FROM CACHE
  // --------------------------------------------------

  private async loadFragments(buffers: ArrayBuffer[], modelKey: string) {
    for (const buffer of buffers) {
      await this.fragments.core.load(buffer, {
        modelId: modelKey,
      });
    }

    this.fragments.core.update(true);
  }

  public async refreshModels(building: Building) {
    this.building = building;

    if (!this.fragments) return;

    console.log("Refreshing building models");

    // Dispose existing fragment models
    for (const [modelId] of this.fragments.list) {
      this.fragments.core.disposeModel(modelId);
    }

    // Reload all models
    await this.loadAllModels();

    this.fragments.core.update(true);
  }
}
