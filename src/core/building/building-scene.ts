import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import type { Building, Floorplan } from "../../types";
import workerUrl from "@thatopen/fragments/dist/Worker/worker.mjs?worker&url";
import { localModelStore } from "../db/local-model-store";
import type { Events } from "../../middleware/event-handler";
import * as THREE from "three";

export class BuildingScene {
  private components: OBC.Components;
  private world!: OBC.World;
  private ifcLoader!: OBC.IfcLoader;
  private fragments!: OBC.FragmentsManager;
  private disposed = false;

  private events: Events;
  private floorplans: Floorplan[] = [];
  private views!: OBC.Views;
  private caster!: OBC.Raycasters;

  private sceneEvents: { name: string; action: any }[] = [];

  private fragmentsReady = false;
  private preselectRAF: number | null = null;

  private highlighter!: OBF.Highlighter;

  constructor(
    private container: HTMLDivElement,
    private building: Building,
    events: Events,
  ) {
    this.events = events;
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
    this.toggleEvents(false);

    if (this.preselectRAF !== null) {
      cancelAnimationFrame(this.preselectRAF);
      this.preselectRAF = null;
    }
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

    this.fragmentsReady = true;

    this.highlighter = this.components.get(OBF.Highlighter);
    this.highlighter.setup({
      world: this.world,
    });

    // Define styles
    this.highlighter.styles.set("hover", {
      color: new THREE.Color(0xffc0cb), // pink
      opacity: 0.3,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("select", {
      color: new THREE.Color("purple"),
      opacity: 0.6,
      transparent: true,
      renderedFaces: 1,
    });

    const raycasters = this.components.get(OBC.Raycasters);
    this.caster = raycasters.get(this.world);

    this.setupEvents();

    //Views - for floorplans

    this.views = this.components.get(OBC.Views);

    OBC.Views.defaultRange = 100;
    this.views.world = this.world;

    // Debug listener
    this.views.list.onItemSet.add(({ key }) => {
      console.log("View created:", key);
    });

    await this.views.createFromIfcStoreys(); //storeyNames?: RegExp[]; use this to filter by some IFC modelling requirement (e.g. Level...)
    //{ storeyNames: [/\bLevel\b/]}
    // Build floorplans array
    this.floorplans = [...this.views.list.keys()].map((name) => ({
      id: name,
      name,
    }));

    // Trigger existing event system
    this.events.trigger({
      type: "UPDATE_FLOORPLANS",
      payload: this.floorplans,
    });
    //console.log("fragments core: ", this.fragments.core);
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

    this.fragmentsReady = false;

    if (!this.fragments) return;

    console.log("Refreshing building models");

    // Dispose existing fragment models
    for (const [modelId] of this.fragments.list) {
      this.fragments.core.disposeModel(modelId);
    }

    // Reload all models
    await this.loadAllModels();
    this.fragmentsReady = true;
    this.fragments.core.update(true);
  }

  toggleFloorplan(active: boolean, floorplan?: Floorplan) {
    if (!this.views || !this.floorplans.length) return;

    if (active && floorplan) {
      // Hide grid (same as before)
      const grids = this.components.get(OBC.Grids);
      grids.list.forEach((grid) => (grid.visible = false));

      // Open the view
      this.views.open(floorplan.id);
    } else {
      // Show grid again
      const grids = this.components.get(OBC.Grids);
      grids.list.forEach((grid) => (grid.visible = true));

      // Exit 2D mode
      this.views.close();
    }
  }

  private setupEvents() {
    this.sceneEvents = [
      { name: "pointermove", action: this.preselect },
      { name: "click", action: this.select },
    ];

    this.toggleEvents(true);
  }

  private toggleEvents(active: boolean) {
    for (const event of this.sceneEvents) {
      if (active) {
        this.container.addEventListener(event.name, event.action);
      } else {
        this.container.removeEventListener(event.name, event.action);
      }
    }
  }

  private preselect = async () => {
    if (!this.fragmentsReady || this.disposed) return;

    const result = await this.caster.castRay();

    if (!result) {
      this.highlighter.clear("hover");
      return;
    }

    const modelIdMap = {
      [result.fragments.modelId]: new Set([result.localId]),
    };

    this.highlighter.highlight("hover", modelIdMap);
  };

  private select = async () => {
    if (!this.fragmentsReady || this.disposed) return;

    const result = await this.caster.castRay();

    // Clicked empty space
    if (!result) {
      this.highlighter.clear("select");

      this.events.trigger({
        type: "UPDATE_PROPERTIES",
        payload: [],
      });

      return;
    }

    const modelId = result.fragments.modelId;
    const localId = result.localId;

    const modelIdMap = {
      [modelId]: new Set([localId]),
    };

    // Apply selection
    this.highlighter.highlight("select", modelIdMap);

    // ---- properties logic ----
    const model = this.fragments.list.get(modelId);
    if (!model) return;

    const [props] = await model.getItemsData([localId]);

    if (!props) {
      this.events.trigger({
        type: "UPDATE_PROPERTIES",
        payload: [],
      });
      return;
    }

    const formatted = Object.entries(props).map(([name, value]: any) => {
      let finalValue = value;

      if (!finalValue) finalValue = "Unknown";
      if (finalValue?.value) finalValue = finalValue.value;
      if (typeof finalValue === "number") finalValue = finalValue.toString();

      return { name, value: finalValue };
    });

    this.events.trigger({
      type: "UPDATE_PROPERTIES",
      payload: formatted,
    });
  };
}
