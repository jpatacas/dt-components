import mapboxgl from "mapbox-gl";
import { MAPBOX_KEY } from "../../config";
import type { GisParameters } from "../../types";

export class MapScene {
  private map!: mapboxgl.Map;
  private readonly style = "mapbox://styles/mapbox/light-v11";

  constructor(container: HTMLDivElement) {
    const config = this.getConfig(container);
    this.initializeMap(config);
  }

  dispose() {
    if (this.map) {
      this.map.remove();
    }
  }

  // -------------------------
  // Initialization
  // -------------------------

  private initializeMap(config: GisParameters) {
    mapboxgl.accessToken = MAPBOX_KEY;

    this.map = new mapboxgl.Map({
      container: config.container,
      style: this.style,
      center: config.center,
      zoom: config.zoom,
      pitch: config.pitch,
      bearing: config.bearing,
      antialias: true,
    });

    this.map.on("load", () => {
      this.setupBaseLayers();
      //   this.setupInteractions();
    });
  }

  // -------------------------
  // Base Layers
  // -------------------------

  private setupBaseLayers() {
    // 3d buildings layer

    this.map.addLayer({
      id: "add-3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#aaa",

        // Use an 'interpolate' expression to
        // add a smooth transition effect to
        // the buildings as the user zooms in.
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "min_height"],
        ],
        "fill-extrusion-opacity": 0.6,
      },
    });
  }

  // -------------------------
  // Config
  // -------------------------

  private getConfig(container: HTMLDivElement): GisParameters {
    return {
      container,
      accessToken: MAPBOX_KEY,
      center: [-0.139203, 51.499702],
      zoom: 15,
      pitch: 60,
      bearing: -40,
      buildings: [],
    };
  }
}
