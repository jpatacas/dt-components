import mapboxgl from "mapbox-gl";
import type { UrbanSensor } from "../../../types";

export const pm25Layer = {
  id: "pm25",
  label: "PM2.5",
  group: "Diagnostic",
  selection: "multiple" as const,

  add: (map: mapboxgl.Map, sensors: UrbanSensor[]) => {
    const features = sensors
      .map((sensor) => {
        const pm25 = sensor.values["PM2.5"];

        if (!pm25) return null;

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
            value: pm25.Value,
            unit: pm25.Unit ?? "ppm",
            variable: "PM2.5",
          },
        };
      })
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null);

    console.log("PM 2.5 Heatmap features:", features.length);

    if (map.getSource("pm25")) {
      (map.getSource("pm25") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features,
      });

      return;
    }

    map.addSource("pm25", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features,
      },
    });

    map.addLayer({
      id: "pm25-heatmap",
      type: "heatmap",
      source: "pm25",
      maxzoom: 15,
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "value"],
            0,
            0,

            25,
            0.3,

            50,
            0.6,

            100,
            1,
        ],

        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 5],

        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0,0,255,0)",
          0.2,
          "blue",
          0.4,
          "cyan",
          0.6,
          "lime",
          0.8,
          "yellow",
          1,
          "red",
        ],

        "heatmap-radius": ["interpolate", ["linear"], ["zoom"],             0,
            120,

            8,
            110,

            12,
            90,

            15,
            60,],

        "heatmap-opacity": 0.8,
      },
    });

    //---------------------------------------
    // Sensor points
    //---------------------------------------

    map.addLayer({
      id: "pm25-points",
      type: "circle",
      source: "pm25",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          8,
          10,
          10,
          15,
          12,
        ],

        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          40,
          "#4575b4",
          65,
          "#e0f3f8",
          90,
          "#d73027",
        ],

        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#222",
      },
    });

    //---------------------------------------
    // Popup
    //---------------------------------------

    map.on("click", "pm25-points", (e) => {
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
          PM 2.5: ${Number(feature.properties?.value).toFixed(1)}μg/m³
        `,
        )
        .addTo(map);
    });

    map.on("mouseenter", "pm25-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "pm25-points", () => {
      map.getCanvas().style.cursor = "";
    });

    //---------------------------------------
    // Fly to first sensor
    //---------------------------------------

    if (features.length > 0) {
      map.flyTo({
        center: features[0].geometry.coordinates,
        zoom: 13,
        speed: 0.8,
      });
    }
  },

  remove: (map: mapboxgl.Map) => {
    if (map.getLayer("pm25-points")) 
      map.removeLayer("pm25-points");

    if (map.getLayer("pm25-heatmap")) {
      map.removeLayer("pm25-heatmap");
    }
    if (map.getSource("pm25")) {
      map.removeSource("pm25");
    }
  },
};
