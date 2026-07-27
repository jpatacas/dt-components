import mapboxgl from "mapbox-gl";
import type { UrbanSensor } from "../../../types";

export const humidityLayer = {
  id: "humidity",
  label: "Humidity",
  group: "Diagnostic",
  selection: "multiple" as const,

  add: (map: mapboxgl.Map, sensors: UrbanSensor[]) => {
    const features = sensors
      .map((sensor) => {
        const humidity = sensor.values["Humidity"];

        if (!humidity) return null;

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
            value: humidity.Value,
            unit: humidity.Unit ?? "%",
            variable: "Humidity",
          },
        };
      })
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null);

    console.log("Humidity sensors:", features.length);

    if (map.getSource("humidity")) {
      (map.getSource("humidity") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features,
      });

      return;
    }

    map.addSource("humidity", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features,
      },
    });

    //---------------------------------------
    // Heatmap
    //---------------------------------------

    map.addLayer({
      id: "humidity-heatmap",
      type: "heatmap",
      source: "humidity",
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          40, 0,
          65, 0.5,
          90, 1,
        ],

        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 1,
          15, 5,
        ],

        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0.0, "rgba(0,0,255,0)",
          0.2, "#4575b4",
          0.4, "#91bfdb",
          0.6, "#e0f3f8",
          0.8, "#fee090",
          1.0, "#d73027",
        ],

        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 120,
          8, 110,
          12, 90,
          15, 60,
        ],

        "heatmap-opacity": 0.85,
      },
    });

    //---------------------------------------
    // Sensor points
    //---------------------------------------

    map.addLayer({
      id: "humidity-points",
      type: "circle",
      source: "humidity",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 8,
          10, 10,
          15, 12,
        ],

        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          40, "#4575b4",
          65, "#e0f3f8",
          90, "#d73027",
        ],

        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#222",
      },
    });

    //---------------------------------------
    // Popup
    //---------------------------------------

    map.on("click", "humidity-points", (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const coordinates = (feature.geometry as GeoJSON.Point)
        .coordinates as [number, number];

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <strong>${feature.properties?.name}</strong><br/>
          Humidity: ${Number(feature.properties?.value).toFixed(1)}%
        `)
        .addTo(map);
    });

    map.on("mouseenter", "humidity-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "humidity-points", () => {
      map.getCanvas().style.cursor = "";
    });

    //---------------------------------------
    // Fly to first sensor
    //---------------------------------------

    if (features.length > 0) {
      map.flyTo({
        center: features[0].geometry.coordinates,
        zoom: 13,
        speed: 0.8
      });
    }
  },

  remove: (map: mapboxgl.Map) => {
    if (map.getLayer("humidity-points"))
      map.removeLayer("humidity-points");

    if (map.getLayer("humidity-heatmap"))
      map.removeLayer("humidity-heatmap");

    if (map.getSource("humidity"))
      map.removeSource("humidity");
  },
};