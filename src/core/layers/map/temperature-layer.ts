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
        console.log(value)

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
          0,
          100,
          1,
        ],

        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 4],

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

        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 50, 15, 40],

        "heatmap-opacity": 0.8,
      },
    });
    map.flyTo({
      center: features[0]?.geometry.coordinates,
      zoom: 12,
    });
  },

  remove: (map: mapboxgl.Map) => {
    if (map.getLayer("temperature-heatmap")) {
      map.removeLayer("temperature-heatmap");
    }
    if (map.getSource("temperature")) {
      map.removeSource("temperature");
    }
  },
};
