import * as OBC from "@thatopen/components";

export class BuildingScene {
  components: OBC.Components;
  world!: OBC.World;

  constructor(container: HTMLDivElement) {
    // Core engine
    this.components = new OBC.Components();

    // Worlds manager (new architecture)
    const worlds = this.components.get(OBC.Worlds);

    // Create world
    this.world = worlds.create<
      OBC.SimpleScene,
      OBC.SimpleCamera,
      OBC.SimpleRenderer
    >();

    // Scene
    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.scene.setup();
    this.world.scene.three.background = null;

    // Renderer
    this.world.renderer = new OBC.SimpleRenderer(
      this.components,
      container
    );

    // Camera
    this.world.camera = new OBC.SimpleCamera(this.components);
    this.world.camera.controls.setLookAt(12, 8, 6, 0, 0, 0);

    // Init components
    this.components.init();

    // Grid (new system)
    const grids = this.components.get(OBC.Grids);
    grids.create(this.world);
  }

  dispose() {
    this.components.dispose();
  }
}