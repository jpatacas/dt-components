import * as OBC from "@thatopen/components";
import { type Building } from "../../types";
import { BuildingDatabase } from "./building-database";
import workerUrl from "@thatopen/fragments/dist/Worker/worker.mjs?worker&url";
import { localModelStore } from "../db/local-model-store";

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

  console.time("Total model load");

  // ---------------------------------------
  // Try fragment cache first
  // ---------------------------------------

  console.time("Fragment cache lookup");
  const cached = await localModelStore.getFragments(this.building.uid);
  console.timeEnd("Fragment cache lookup");

  if (cached && cached.length > 0) {

    console.time("Fragment load from cache");

    await this.loadFragments(cached);

    console.timeEnd("Fragment load from cache");
    console.timeEnd("Total model load");

    return;
  }

  // ---------------------------------------
  // No cache → Load IFC
  // ---------------------------------------

  console.log("No fragment cache — converting IFC");

  console.time("Retrieve IFC from IndexedDB");
  const files = await this.database.getModels(this.building);
  console.timeEnd("Retrieve IFC from IndexedDB");

  console.time("IFC → Fragment conversion");

  for (const file of files) {
    await this.convertIfcAndCache(file);
  }

  console.timeEnd("IFC → Fragment conversion");
  console.timeEnd("Total model load");
}

  // --------------------------------------------------
  // IFC → FRAGMENTS → CACHE
  // --------------------------------------------------

  private async convertIfcAndCache(file: File) {

    console.time("IFC conversion");

    const buffer = new Uint8Array(await file.arrayBuffer());

    await this.ifcLoader.load(buffer, false, file.name);

    // Extract fragment buffers (3.3 compatible)
    const fragmentBuffers: ArrayBuffer[] = [];

    for (const [, model] of this.fragments.list) {
      const fragBuffer = await model.getBuffer(false);
      fragmentBuffers.push(fragBuffer);
    }

    await localModelStore.saveFragments(
      this.building.uid,
      fragmentBuffers
    );

    console.timeEnd("IFC conversion");
  }

  // --------------------------------------------------
  // LOAD FRAGMENTS FROM CACHE
  // --------------------------------------------------

  private async loadFragments(buffers: ArrayBuffer[]) {

  console.time("fragments.core.load()");

  await Promise.all(
    buffers.map(async (buffer) => {
      await this.fragments.core.load(buffer, {
        modelId: this.building.uid,
      });
    }),
  );

  this.fragments.core.update(true);

  console.timeEnd("fragments.core.load()");
}

public async refreshModels(building: Building) {
  this.building = building;

  // Dispose existing fragment models
  for (const [modelId] of this.fragments.list) {
    this.fragments.core.disposeModel(modelId);
  }

  // Invalidate fragment cache
  await localModelStore.deleteFragments(this.building.uid);

  // Reload models
  await this.loadAllModels();
}

}