import * as OBC from "@thatopen/components";
import { type Building } from "../../types";
import { BuildingDatabase } from "./building-database";
import workerUrl from "@thatopen/fragments/dist/Worker/worker.mjs?worker&url"

export class BuildingScene {
  private components: OBC.Components;
  private world!: OBC.World;
  private ifcLoader!: OBC.IfcLoader;
  private fragments!: OBC.FragmentsManager;

  private database = new BuildingDatabase();

  constructor(
    private container: HTMLDivElement,
    private building: Building,
  ) {
    this.components = new OBC.Components();
    this.init();
  }

  // --------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------

  private async init() {
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

  // --------------------------------------------------
  // LOAD IFC
  // --------------------------------------------------

  async loadIfc(file: File) {
    const buffer = new Uint8Array(await file.arrayBuffer());

    await this.ifcLoader.load(buffer, false, file.name, {
      processData: {
        progressCallback: (progress) => console.log("Loading:", progress),
      },
    });
  }

  // --------------------------------------------------
  // LOAD STORED MODELS (IndexedDB)
  // --------------------------------------------------

  private async loadAllModels() {
    const files = await this.database.getModels(this.building);

    for (const file of files) {
      await this.loadIfc(file);
    }
  }

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  dispose() {
    this.components.dispose();
  }
}
