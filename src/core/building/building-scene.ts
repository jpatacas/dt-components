import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import type {
  Building,
  Floorplan,
  RoomInfo,
  BuildingDashboard,
  BuildingAlert,
  SensorInfo,
} from "../../types";
import workerUrl from "@thatopen/fragments/dist/Worker/worker.mjs?worker&url";
import { localModelStore } from "../db/local-model-store";
import type { Events } from "../../middleware/event-handler";
import * as THREE from "three";
import { buildingLayerRegistry } from "../layers/building/building-layer-registry";

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

  private activeLayers = new Set<string>();

  private allItemsCache = new Map<string, number[]>();

  private hider!: OBC.Hider;

  private roomLookup = new Map<string, RoomInfo[]>();

  private roomSensors = new Map<string, SensorInfo[]>();

  private dashboard?: BuildingDashboard;

  private layerCategories = new Map<string, Set<string>>();

  private selectedRoom?: string;

  private classifier!: OBC.Classifier;

  private previousOccupiedRooms = 0;

  constructor(
    private container: HTMLDivElement,
    private building: Building,
    events: Events,
  ) {
    this.events = events;
    this.components = new OBC.Components();
  }

  public getSensorLayer(metric: string, mapper: (value: string) => string) {
    return Array.from(this.roomSensors.entries()).flatMap(
      //return Array.from(this.roomLookup.entries()).flatMap(
      ([spaceName, sensors]) => {
        const sensor = sensors.find((s) =>
          s.name.toLowerCase().includes(metric.toLowerCase()),
        );

        if (!sensor) return [];

        return [
          {
            spaceName,
            category: mapper(sensor.value),
          },
        ];
      },
    );
  }

  private shouldPreserveLayerStyles(props: any) {
    const isSpace =
      props?.type === "IFCSPACE" || props?._category?.value === "IFCSPACE";

    const hasActiveLayers = this.activeLayers.size > 0;

    return isSpace && hasActiveLayers;
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
      OBF.PostproductionRenderer
    >();

    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.scene.setup();
    this.world.scene.three.background = null;

    this.world.renderer = new OBC.SimpleRenderer(
      this.components,
      this.container,
    );

    //floorplans visualisation not working with this
    // this.world.renderer = new OBF.PostproductionRenderer(
    //   this.components,
    //   this.container,
    // );

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

    this.classifier = this.components.get(OBC.Classifier);

    // Build the standard IFC classifications
    await this.classifier.byModel();
    await this.classifier.byCategory();
    await this.classifier.byIfcBuildingStorey();

    console.log(this.classifier.list);

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

    //for building layers test
    this.highlighter.styles.set("layer", {
      color: new THREE.Color(0x000000),
      opacity: 1,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("unknown", {
      color: new THREE.Color(0xaaaaaa), // grey default
      opacity: 0.1,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("occupied", {
      color: new THREE.Color(0xff0000),
      opacity: 0.5,
      transparent: false,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("free", {
      color: new THREE.Color(0x00ff00),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("hot", {
      color: new THREE.Color("#ff8800"),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("comfortable", {
      color: new THREE.Color("#44ff44"),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("cold", {
      color: new THREE.Color("#4488ff"),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("dry", {
      color: new THREE.Color("#f5deb3"),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("humid", {
      color: new THREE.Color("#4169e1"),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("good", {
      color: new THREE.Color("#44ff44"),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("moderate", {
      color: new THREE.Color("#ffaa00"),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    this.highlighter.styles.set("poor", {
      color: new THREE.Color("#ff4444"),
      opacity: 0.5,
      transparent: true,
      renderedFaces: 1,
    });

    const raycasters = this.components.get(OBC.Raycasters);
    this.caster = raycasters.get(this.world);

    const clipper = this.components.get(OBC.Clipper);
    clipper.enabled = true;

    this.container.ondblclick = () => {
      if (clipper.enabled) {
        clipper.create(this.world);
      }
    };

    const toggleClippings = () => {
      for (const [, clipping] of clipper.list) {
        clipping.enabled = !clipping.enabled;
      }
    };

    window.onkeydown = (event) => {
      if (event.code === "Delete" || event.code === "Backspace") {
        if (clipper.enabled) clipper.delete(this.world);
      }
    };

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

    //Hider for building layers
    this.hider = this.components.get(OBC.Hider);

    this.lookupIFCSpaces();

    //room lookup for UO - USB only! - need to improve this
    if (this.building.name === "USB") {
      await this.buildBuildingDashboard();
      //console.log("room lookup: ", this.roomLookup);
    }
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

    //this.highlighter.highlight("hover", modelIdMap);

    const model = this.fragments.list.get(result.fragments.modelId);

    if (!model) return;

    const [props] = await model.getItemsData([result.localId]);

    if (this.shouldPreserveLayerStyles(props)) {
      this.highlighter.clear("hover");
    } else {
      this.highlighter.highlight("hover", modelIdMap);
    }
  };

  private select = async () => {
    if (!this.fragmentsReady || this.disposed) return;

    const result = await this.caster.castRay();

    //----------------------------------------------------------
    // Clicked empty space
    //----------------------------------------------------------

    if (!result) {
      this.highlighter.clear("select");

      this.events.trigger({
        type: "UPDATE_PROPERTIES",
        payload: [],
      });

      this.events.trigger({
        type: "CLEAR_SENSOR_HISTORY",
      });

      this.selectedRoom = undefined;

      return;
    }

    const modelId = result.fragments.modelId;
    const localId = result.localId;

    //----------------------------------------------------------
    // Read IFC properties
    //----------------------------------------------------------

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

    //----------------------------------------------------------
    // Highlight every IFC space belonging to the same room
    //----------------------------------------------------------

    const roomName = props?.Name?.value;
    if (!roomName) return;

    const key = this.normalizeRoomNumber(roomName);

    const rooms = this.roomLookup.get(key) ?? [];

    const modelIdMap: OBC.ModelIdMap = {};

    if (rooms.length > 0) {
      for (const room of rooms) {
        if (!modelIdMap[room.modelId]) {
          modelIdMap[room.modelId] = new Set<number>();
        }

        modelIdMap[room.modelId].add(room.localId);
      }

      this.highlighter.highlight("select", modelIdMap);
    } else {
      // Fallback if no lookup exists
      this.highlighter.highlight("select", {
        [modelId]: new Set([localId]),
      });
    }

    //----------------------------------------------------------
    // IFC properties
    //----------------------------------------------------------

    const formatted = Object.entries(props).map(([name, value]: any) => {
      let finalValue = value;

      if (!finalValue) finalValue = "Unknown";
      if (finalValue?.value) finalValue = finalValue.value;
      if (typeof finalValue === "number") finalValue = finalValue.toString();

      return { name, value: finalValue };
    });

    //----------------------------------------------------------
    // Sensor data
    //----------------------------------------------------------

    if (key !== this.selectedRoom) {
      this.events.trigger({
        type: "CLEAR_SENSOR_HISTORY",
      });

      this.selectedRoom = key;
    }

    const sensors = this.roomSensors.get(key) ?? [];

    if (sensors.length > 0) {
      formatted.push(
        { name: "----- SENSOR DATA -----", value: "" },
        ...sensors.map((sensor) => ({
          ...sensor,
          type: "sensor",
        })),
      );
    }

    //----------------------------------------------------------
    // Update UI
    //----------------------------------------------------------

    this.events.trigger({
      type: "UPDATE_PROPERTIES",
      payload: formatted,
    });
  };

  public async updateLayers(layerIds: string[]) {
    const next = new Set(layerIds.filter(Boolean));

    console.log("Selected layers:", layerIds);
    console.log("Registry keys:", Object.keys(buildingLayerRegistry));

    // REMOVE old
    for (const id of this.activeLayers) {
      if (!next.has(id)) {
        const layer = buildingLayerRegistry[id];
        if (layer) {
          await layer.remove(this);
        }
      }
    }

    // ADD new
    for (const id of next) {
      if (!this.activeLayers.has(id)) {
        const layer = buildingLayerRegistry[id];

        if (!layer) {
          console.warn(`Layer not registered: ${id}`);
          continue;
        }

        let data;

        if (layer.fetch) {
          data = await layer.fetch(this);
        }

        await layer.add(this, data);
      }
    }

    console.log("BUILDING ACTIVE LAYERS:", [...this.activeLayers]);

    this.activeLayers = next;
  }

  private flattenModelIdMap(map: any): number[] {
    return Object.values(map).flatMap((set: any) => [...set]);
  }

  private async getAllItems(model: any) {
    if (!this.allItemsCache.has(model.modelId)) {
      const ids = this.flattenModelIdMap(await model.getItems());
      this.allItemsCache.set(model.modelId, ids);
    }

    return this.allItemsCache.get(model.modelId)!;
  }

  public async showArch() {
    const architectural = await this.classifier.find({
      Categories: [
        "IFCWALL",
        "IFCWALLSTANDARDCASE",
        "IFCDOOR",
        "IFCWINDOW",
        "IFCSLAB",
        "IFCSTAIR",
        "IFCRAMP",
        "IFCCOVERING",
      ],
    });

    await this.hider.isolate(architectural);
  }

  public async showStruct() {
    const structural = await this.classifier.find({
      Categories: [
        "IFCBEAM",
        "IFCCOLUMN",
        "IFCFOOTING",
        "IFCMEMBER",
        "IFCPILE",
        "IFCPLATE",
        "IFCSLAB",
      ],
    });
    await this.hider.isolate(structural);
  }

  public async showMEP() {
    const mep = await this.classifier.find({
      Categories: [
        "IFCFLOWSEGMENT",
        "IFCFLOWTERMINAL",
        "IFCFLOWFITTING",
        "IFCFLOWCONTROLLER",
        "IFCFLOWDEVICE",
        "IFCDUCTSEGMENT",
        "IFCPIPESEGMENT",
        "IFCCABLECARRIERSEGMENT",
      ],
    });
    await this.hider.isolate(mep);
  }

  public async lookupIFCSpaces() {
    this.roomLookup.clear();

    for (const [, model] of this.fragments.list) {
      const items = await model.getItemsOfCategories([/\bIFCSPACE\b/]);

      const spaceIds = Object.values(items).flat();

      for (const localId of spaceIds) {
        const [props] = await model.getItemsData([localId]);

        const roomName = props?.Name?.value;
        if (!roomName) continue;

        const key = this.normalizeRoomNumber(roomName);

        let rooms = this.roomLookup.get(key);

        if (!rooms) {
          rooms = [];
          this.roomLookup.set(key, rooms);
        }

        rooms.push({
          name: roomName,
          modelId: model.modelId,
          localId: Number(localId),
          longName: props?.LongName?.value,
        });
      }
    }

    console.log(this.roomLookup);
  }

  public async showOnlySpaces() {
    const modelIdMap: OBC.ModelIdMap = {};

    for (const [, model] of this.fragments.list) {
      const items = await model.getItemsOfCategories([/\bIFCSPACE\b/]);

      const spaceIds = Object.values(items).flat();

      if (spaceIds.length === 0) continue;

      modelIdMap[model.modelId] = new Set(spaceIds);
    }

    for (const [modelId, ids] of Object.entries(modelIdMap)) {
      const model = this.fragments.list.get(modelId);

      if (!model) continue;

      for (const localId of ids) {
        const [props] = await model.getItemsData([localId]);

        console.log(localId);
        console.log(props?.Name?.value);
      }
    }

    //console.log("Isolating IFCSPACES:", modelIdMap);

    await this.hider.isolate(modelIdMap);
  }

  public async showOnlySpaces2() {
    const spaces = await this.classifier.find({
      Categories: ["IFCSPACE"],
    });

    console.log("Isolating IFCSPACES:", spaces);
    await this.hider.isolate(spaces);
  }

  public async showAll() {
    await this.hider.set(true);
  }

  //get spaces by name
  public async getSpacesByData(data: any[]) {
    const result: Record<string, Set<number>> = {};

    for (const [, model] of this.fragments.list) {
      const spacesMap = await model.getItemsOfCategories([/\bIFCSPACE\b/]);

      const spaceIds: number[] = Object.values(spacesMap).flatMap(
        (set: any) => [...set],
      );

      // fetch ALL properties at once
      const itemsData = await model.getItemsData(spaceIds);

      for (let i = 0; i < spaceIds.length; i++) {
        const id = spaceIds[i];
        const props = itemsData[i];

        const name = props?.Name?.value;

        const match = data.find((d) => d.spaceName === name);

        if (!match) continue;

        if (!result[model.modelId]) {
          result[model.modelId] = new Set();
        }

        result[model.modelId].add(id);
      }
    }

    return result;
  }

  public async applyLayer(map: OBC.ModelIdMap) {
    if (!map || Object.keys(map).length === 0) {
      console.warn("Empty layer map");
      return;
    }

    // 1. isolate (hide everything else)
    await this.hider.isolate(map);

    // this.highlighter.clear("hover");
    // this.highlighter.clear("select");
    this.highlighter.clear("layer");

    // 2. color (using Highlighter custom style)
    this.highlighter.highlightByID("layer", map);
    console.log("Highlighting layer:", map);
    console.log("Layer style:", this.highlighter.styles.get("layer"));
  }

  public async getAllSpaces(): Promise<OBC.ModelIdMap> {
    const result: OBC.ModelIdMap = {};

    for (const [, model] of this.fragments.list) {
      const items = await model.getItemsOfCategories([/\bIFCSPACE\b/]);

      const ids = Object.values(items).flat();

      if (ids.length === 0) continue;

      result[model.modelId] = new Set(ids);
    }

    console.log(result);
    return result;
  }

  public async applyLayerWithColors(
    layerId: string,
    data: {
      spaceName: string;
      category: string;
    }[],
  ) {
    if (!data.length) {
      console.warn(`No data supplied for layer '${layerId}'`);
      return;
    }

    const baseMap = await this.getSpacesByData(data);

    const dataMap = new Map(data.map((d) => [d.spaceName.trim(), d.category]));

    const groups = new Map<string, OBC.ModelIdMap>();

    const categories = new Set<string>();

    for (const modelId in baseMap) {
      const model = this.fragments.list.get(modelId);

      if (!model) continue;

      for (const id of baseMap[modelId]) {
        const [props] = await model.getItemsData([id]);

        const name = props?.Name?.value?.trim();

        if (!name) continue;

        const category = dataMap.get(name);

        if (!category) continue;

        categories.add(category);

        if (!groups.has(category)) {
          groups.set(category, {});
        }

        const target = groups.get(category)!;

        if (!target[modelId]) {
          target[modelId] = new Set();
        }

        target[modelId].add(id);
      }
    }

    // Remember which highlight styles
    // belong to this layer
    this.layerCategories.set(layerId, categories);

    // Isolate only the spaces that belong
    // to this dataset
    //await this.hider.isolate(baseMap);

    // Apply highlighting by category
    for (const [category, map] of groups) {
      console.log(`Applying '${category}'`, map);

      this.highlighter.highlightByID(category, map);
    }
  }

  public async resetLayer() {
    console.log("Resetting layer");

    // show everything
    await this.hider.set(true);

    // clear highlight?
    //this.highlighter.clear("layer");
  }

  public clearLayer(layerId: string) {
    const categories = this.layerCategories.get(layerId);

    if (!categories) return;

    for (const category of categories) {
      this.highlighter.clear(category);
    }

    this.layerCategories.delete(layerId);
  }

  // query Urban Observatory and build room lookup
  private async buildBuildingDashboard() {
    const response = await fetch(
      "https://api.usb.urbanobservatory.ac.uk/api/v2.0a/sensors/entity?pageSize=100",
    );

    const data = await response.json();

    //this.roomLookup.clear();
    this.roomSensors.clear();

    const temperatures: number[] = [];
    const humidities: number[] = [];
    const co2Values: number[] = [];
    const alertList: BuildingAlert[] = [];

    const now = new Date();

    let totalSensors = 0;
    let onlineSensors = 0;
    let offlineSensors = 0;

    // let monitoredRooms = 0;
    // let alerts = 0;

    let occupiedRooms = 0;
    let unoccupiedRooms = 0;

    const monitoredRoomSet = new Set<string>();

    for (const entity of data.items ?? []) {
      const roomNumber = entity.meta?.roomNumber;

      if (!roomNumber) continue;

      // monitoredRooms++;

      monitoredRoomSet.add(roomNumber);

      const sensors = [];

      for (const feed of entity.feed ?? []) {
        for (const ts of feed.timeseries ?? []) {
          totalSensors++; // check this

          const latest = ts.latest;

          if (
            latest?.value !== undefined &&
            latest?.value !== null &&
            latest?.value !== ""
          ) {
            onlineSensors++;
          } else {
            offlineSensors++;
          }

          if (!latest) continue;

          const value = latest.value;

          if (value === undefined || value === null || value === "") {
            continue;
          }

          sensors.push({
            name: feed.metric,
            value: String(value),
            timeseriesId: ts.timeseriesId,
            unit: ts.unit?.name,
          });

          //--------------------------------------------------
          // Executive KPI statistics
          //--------------------------------------------------

          const key = this.normalizeRoomNumber(roomNumber);

          const rooms = this.roomLookup.get(key) ?? [];

          const matchingRoom =
            rooms.find((r) => r.name === roomNumber) ??
            rooms.find((r) => r.name.startsWith(roomNumber)) ??
            rooms[0];
          const numeric = Number(value);

          if (Number.isNaN(numeric)) continue;

          switch (feed.metric?.toLowerCase()) {
            case "room temperature":
              temperatures.push(numeric);

              // if (numeric < 18 || numeric > 26) {
              //   alerts++;
              // }
              if (numeric < 18) {
                alertList.push({
                  room: roomNumber,
                  modelId: matchingRoom?.modelId,
                  localId: matchingRoom?.localId,
                  metric: "Temperature",
                  value: numeric,
                  unit: ts.unit?.name,
                  severity: "warning",
                  message: `Temperature is too low (${numeric}${ts.unit?.name ?? "°C"})`,
                });
              }

              if (numeric > 26) {
                alertList.push({
                  room: roomNumber,
                  modelId: matchingRoom?.modelId,
                  localId: matchingRoom?.localId,
                  metric: "Temperature",
                  value: numeric,
                  unit: ts.unit?.name,
                  severity: numeric > 30 ? "critical" : "warning",
                  message: `Temperature is too high (${numeric}${ts.unit?.name ?? "°C"})`,
                });
              }
              break;

            case "relative humidity":
              humidities.push(numeric);

              if (numeric < 30) {
                alertList.push({
                  room: roomNumber,
                  modelId: matchingRoom?.modelId,
                  localId: matchingRoom?.localId,
                  metric: "Humidity",
                  value: numeric,
                  unit: "%",
                  severity: "warning",
                  message: `Humidity is below the recommended range (${numeric}%)`,
                });
              }

              if (numeric > 70) {
                alertList.push({
                  room: roomNumber,
                  modelId: matchingRoom?.modelId,
                  localId: matchingRoom?.localId,
                  metric: "Humidity",
                  value: numeric,
                  unit: "%",
                  severity: numeric > 80 ? "critical" : "warning",
                  message: `Humidity is above the recommended range (${numeric}%)`,
                });
              }
              break;

            case "co2":
              co2Values.push(numeric);

              if (numeric > 1000) {
                alertList.push({
                  room: roomNumber,
                  modelId: matchingRoom?.modelId,
                  localId: matchingRoom?.localId,
                  metric: "CO₂",
                  value: numeric,
                  unit: "ppm",
                  severity: numeric > 1500 ? "critical" : "warning",
                  message: `High CO₂ concentration (${numeric} ppm)`,
                });
              }
              break;

            case "occupancy sensor":
              if (numeric === 1) {
                occupiedRooms++;
              } else if (numeric === 0) {
                unoccupiedRooms++;
              }
              break;
          }
        }
      }

      const key = this.normalizeRoomNumber(roomNumber);

      this.roomSensors.set(key, sensors);
    }

    const average = (values: number[]) =>
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    const avgTemperature = average(temperatures);
    const avgHumidity = average(humidities);
    const avgCO2 = average(co2Values);

    const monitoredRooms = monitoredRoomSet.size;

    const occupancyRate =
      occupiedRooms + unoccupiedRooms > 0
        ? (occupiedRooms / monitoredRooms) * 100
        : 0;

    const coveragePercentage =
      this.roomSensors.size > 0
        ? (monitoredRooms / this.roomSensors.size) * 100
        : 0;

    const sensorHealth =
      totalSensors > 0 ? (onlineSensors / totalSensors) * 100 : 0;

    const occupancyChange =
      monitoredRooms > 0
        ? ((occupiedRooms - this.previousOccupiedRooms) / monitoredRooms) * 100
        : 0;

    this.previousOccupiedRooms = occupiedRooms;

    let comfortIndex = 100;

    if (avgTemperature < 20 || avgTemperature > 24) comfortIndex -= 20;

    if (avgHumidity < 40 || avgHumidity > 60) comfortIndex -= 20;

    if (avgCO2 > 1000) comfortIndex -= 30;

    comfortIndex -= alertList.length * 5;

    comfortIndex = Math.max(0, comfortIndex);

    this.dashboard = {
      rooms: this.roomSensors.size,

      monitoredRooms,

      totalRooms: this.roomSensors.size,

      occupiedRooms,
      unoccupiedRooms,

      occupancyRate,

      avgTemperature,
      avgHumidity,
      avgCO2,

      maxTemperature: temperatures.length > 0 ? Math.max(...temperatures) : 0,

      minTemperature: temperatures.length > 0 ? Math.min(...temperatures) : 0,

      maxHumidity: humidities.length > 0 ? Math.max(...humidities) : 0,

      minHumidity: humidities.length > 0 ? Math.min(...humidities) : 0,

      maxCO2: co2Values.length > 0 ? Math.max(...co2Values) : 0,

      minCO2: co2Values.length > 0 ? Math.min(...co2Values) : 0,

      alerts: alertList.length,
      alertList,

      comfortIndex,

      coveragePercentage,

      occupancyChange,

      sensorHealth,

      onlineSensors,
      offlineSensors,
      totalSensors,

      lastUpdated: now,

      lastUpdatedText: now.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "medium",
      }),
    };

    console.log("Room sensors:", this.roomSensors);
    console.log("Dashboard:", this.dashboard);

    this.events.trigger({
      type: "UPDATE_BUILDING_DASHBOARD",
      payload: this.dashboard,
    });
  }

  public async getSensorHistory(timeseriesId: string) {
    const response = await fetch(
      `https://api.usb.urbanobservatory.ac.uk/api/v2.0a/sensors/timeseries/${timeseriesId}/historic`,
    );

    const data = await response.json();

    //return data.timeseries ?? [];

    return data.historic.values;
  }

  public async loadSensorHistory(sensor: {
    name: string;
    timeseriesId: string;
    unit?: string;
  }) {
    const history = await this.getSensorHistory(sensor.timeseriesId);

    this.events.trigger({
      type: "UPDATE_SENSOR_HISTORY",
      payload: {
        sensor,
        history,
      },
    });
  }

  public async selectRoom(modelId: string, localId: number) {
    this.showOnlySpaces2();

    //----------------------------------------------------------
    // Read IFC properties
    //----------------------------------------------------------

    const model = this.fragments.list.get(modelId);

    console.log("Select rooms - modelId", modelId);
    if (!model) return;

    const [props] = await model.getItemsData([localId]);

    if (!props) {
      this.events.trigger({
        type: "UPDATE_PROPERTIES",
        payload: [],
      });
      return;
    }

    const roomName = props?.Name?.value;
    if (!roomName) return;

    const key = this.normalizeRoomNumber(roomName);

    //----------------------------------------------------------
    // Highlight all matching IFC spaces
    //----------------------------------------------------------

    const rooms = this.roomLookup.get(key) ?? [];

    console.log("select rooms: ", rooms);

    const modelIdMap: OBC.ModelIdMap = {};

    if (rooms.length > 0) {
      for (const room of rooms) {
        if (!modelIdMap[room.modelId]) {
          modelIdMap[room.modelId] = new Set<number>();
        }

        modelIdMap[room.modelId].add(room.localId);
      }
    } else {
      modelIdMap[modelId] = new Set([localId]);
    }

    await this.highlighter.highlightByID("select", modelIdMap, true);

    //----------------------------------------------------------
    // IFC properties
    //----------------------------------------------------------

    const formatted = Object.entries(props).map(([name, value]: any) => {
      let finalValue = value;

      if (!finalValue) finalValue = "Unknown";
      if (finalValue?.value) finalValue = finalValue.value;
      if (typeof finalValue === "number") finalValue = finalValue.toString();

      return {
        name,
        value: finalValue,
      };
    });

    //----------------------------------------------------------
    // Sensor data
    //----------------------------------------------------------

    if (key !== this.selectedRoom) {
      this.events.trigger({
        type: "CLEAR_SENSOR_HISTORY",
      });

      this.selectedRoom = key;
    }

    const sensors = this.roomSensors.get(key) ?? [];

    if (sensors.length > 0) {
      formatted.push(
        { name: "----- SENSOR DATA -----", value: "" },
        ...sensors.map((sensor) => ({
          ...sensor,
          type: "sensor",
        })),
      );
    }

    //----------------------------------------------------------
    // Update UI
    //----------------------------------------------------------

    this.events.trigger({
      type: "UPDATE_PROPERTIES",
      payload: formatted,
    });

    console.log({
      roomName,
      key,
      matchedSpaces: rooms.map((r) => r.name),
      sensorsCount: sensors.length,
    });
  }

  //normalize room numbers for UO dataset
  private normalizeRoomNumber(room: string): string {
    if (!room) return "";

    return room.trim().toUpperCase().replace(/-\d+$/, ""); // remove "-1", "-2", "-10", etc.
  }
}
