import mapboxgl from "mapbox-gl";
import type { UrbanSensor } from "../../../types";

export const temperatureLayer = {
  id: "temperature",
  label: "Temperature",
  group: "Diagnostic",
  selection: "multiple" as const,

  add: (map: mapboxgl.Map, sensors: UrbanSensor[]) => {
    const features = sensors
      .map((sensor) => {

        const temperature = sensor.values["Temperature"];

        if (!temperature) return null;

        const lng = sensor.Sensor_Centroid_Longitude;
        const lat = sensor.Sensor_Centroid_Latitude;

        if (lng == null || lat == null) return null;

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          properties: {
            name: sensor.Sensor_Name,
            value: temperature.Value,
            unit: temperature.Unit ?? "C",
            variable: "Temperature",
          },
        };
      })
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null);

    console.log("Temperature Heatmap features:", features.length);

    if (map.getSource("temperature")) {
      (map.getSource("temperature") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features,
      });

      return;
    }

    map.addSource("temperature", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features,
      },
    });

    // HEATMAP (smoother + wider)
    map.addLayer({
      id: "temperature-heatmap",
      type: "heatmap",
      source: "temperature",
      maxzoom: 15,
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          0,
          0.2,
          5,
          0.5,
          10,
          0.75,
          17,
          1,
        ],

        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          1,
          10,
          2,
          15,
          5,
        ],

        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0,0,255,0)",
          0.2,
          "#2c2eb6",
          0.4,
          "#2c58b6",
          0.6,
          "#2c7bb6",
          0.8,
          "#abd9e9",
          1,
          "#ffffbf",
        ],

        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          100,
          10,
          120,
          15,
          160,
        ],

        "heatmap-opacity": 0.85,
      },
    });

    // CLICKABLE SENSOR POINTS
    map.addLayer({
      id: "temperature-points",
      type: "circle",
      source: "temperature",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 6, 15, 10],
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          10,
          "#2c7bb6",
          17,
          "#ffffbf",
          25,
          "#d7191c",
        ],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#000",
        "circle-opacity": 0.95,
      },
    });

    // CLICK INTERACTION
    map.on("click", "temperature-points", (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [
        number,
        number,
      ];

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(
          `
          <strong>${feature.properties?.name}</strong><br/>
          Temperature: ${Number(feature.properties?.value).toFixed(1)}°C
        `,
        )
        .addTo(map);
    });

    map.on("mouseenter", "temperature-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "temperature-points", () => {
      map.getCanvas().style.cursor = "";
    });

    // FLY TO
    if (features.length > 0) {
      map.flyTo({
        center: features[0].geometry.coordinates,
        zoom: 13,
        speed: 0.8,
      });
    }
  },

  remove: (map: mapboxgl.Map) => {
    if (map.getLayer("temperature-points")) {
      map.removeLayer("temperature-points");
    }
    if (map.getLayer("temperature-heatmap")) {
      map.removeLayer("temperature-heatmap");
    }
    if (map.getSource("temperature")) {
      map.removeSource("temperature");
    }
  },
};
