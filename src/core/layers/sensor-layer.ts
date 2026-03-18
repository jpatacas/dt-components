//import * as MAPBOX from "mapbox-gl";
import type { LayerDefinition } from "../../types";

const API = "https://corsproxy.io/?https://api.v2.urbanobservatory.ac.uk";

export const sensorLayer = {
  id: "sensors",
  label: "Sensors",
  group: "Diagnostics",
  selection: "multi",

  fetch: async () => {
    const res = await fetch(`${API}/sensors/json?limit=-1`);
    const json = await res.json();

    console.log("sensor data", json);

    //return json.sensors || json.Sensors || [];
    return json.Sensors;
  },

  add: (map: mapboxgl.Map, sensors: any[]) => {
    console.log("RAW SENSOR DATA:", sensors.length);

    if (!Array.isArray(sensors)) return;

    const features = sensors
      .map((s: any) => {
        const lng = s.Sensor_Centroid_Longitude;
        const lat = s.Sensor_Centroid_Latitude;

        if (!lng || !lat) return null;

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          properties: {
            name: s.Sensor_Name,
            broker: s.Broker_Name,
          },
        };
      })
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null);

    console.log("VALID FEATURES:", features.length);

    if (features.length === 0) {
      console.warn("No valid sensor coordinates!");
      return;
    }

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features,
    };

    map.addSource("sensors", {
      type: "geojson",
      data: geojson,
    });

    map.addLayer({
      id: "sensor-layer",
      type: "circle",
      source: "sensors",
      paint: {
        "circle-radius": 4,
        "circle-color": "#ff0000",
      },
    });

    // zoom to sensors (debug)
    // map.flyTo({
    //   center: features[0].geometry.coordinates,
    //   zoom: 12,
    // });
  },

  remove: (map: mapboxgl.Map) => {
    // correct order (CRITICAL)
    if (map.getLayer("sensor-layer")) {
      map.removeLayer("sensor-layer");
    }

    if (map.getSource("sensors")) {
      map.removeSource("sensors");
    }
  },
};
