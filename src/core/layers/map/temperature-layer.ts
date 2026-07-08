import mapboxgl from "mapbox-gl";

export const temperatureLayer = {
  id: "temperature",
  label: "Temperature",
  group: "Diagnostic",
  selection: "multiple" as const,

  fetch: async () => {
    const base = "https://corsproxy.io/?https://api.v2.urbanobservatory.ac.uk";

    // 1. locations
    const sensorsRes = await fetch(`${base}/sensors/json?limit=-1`);
    const sensorsJson = await sensorsRes.json();

    // 2. readings
    const dataRes = await fetch(`${base}/sensors/data/json`);
    const dataJson = await dataRes.json();

    const sensors = sensorsJson.Sensors;
    const readings = dataJson.Readings;

    console.log("Sensors:", sensors.length);
    console.log("Readings:", readings.length);

    // group readings by sensor
    const readingsMap = new Map<string, any>();

    readings.forEach((r: any) => {
      // filter ONLY air quality (IMPORTANT)
      if (!["Temperature"].includes(r.Variable)) return;

      // keep latest (or overwrite)
      readingsMap.set(r.Sensor_Name, r);
    });

    // merge
    const merged = sensors.map((s: any) => {
      const reading = readingsMap.get(s.Sensor_Name);

      return {
        ...s,
        value: reading?.Value,
        variable: reading?.Variable,
      };
    });

    console.log("Temperature Merged sensors:", merged.length);

    return merged;
  },

  add: (map: mapboxgl.Map, sensors: any[]) => {
    const features = sensors
      .map((s) => {
        const lng = s.Sensor_Centroid_Longitude;
        const lat = s.Sensor_Centroid_Latitude;
        const value = s.value;
        console.log(value);

        if (!lng || !lat || value == null) return null;

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          properties: {
            value,
            variable: s.variable,
          },
        };
      })
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null);

    console.log("Temperature Heatmap features:", features.length);

    const geojson = {
      type: "FeatureCollection",
      features,
    };

    map.addSource("temperature", {
      type: "geojson",
      data: geojson,
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

      const value = feature.properties?.value;

      new mapboxgl.Popup()
        .setLngLat(feature.geometry.coordinates as [number, number])
        .setHTML(`<strong>Temperature:</strong> ${value.toFixed(1)}°C`)
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
