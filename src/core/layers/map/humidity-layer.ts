import mapboxgl from "mapbox-gl";

export const humidityLayer = {
  id: "humidity",
  label: "Humidity",
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
      if (!["Humidity"].includes(r.Variable)) return;

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

    console.log("Humidity Merged sensors:", merged.length);

    return merged;
  },

  add: (map: mapboxgl.Map, sensors: any[]) => {
    const features = sensors
      .map((s) => {
        const lng = s.Sensor_Centroid_Longitude;
        const lat = s.Sensor_Centroid_Latitude;
        const value = s.value;

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

    console.log("Humidity Heatmap features:", features.length);

    const geojson = {
      type: "FeatureCollection",
      features,
    };

    map.addSource("humidity", {
      type: "geojson",
      data: geojson,
    });

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
          0, "rgba(0,0,255,0)",
          0.2, "#4575b4",
          0.4, "#91bfdb",
          0.6, "#e0f3f8",
          0.8, "#fee090",
          1, "#c227d7",
        ],

        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 100,
          10, 120,
          15, 60,
        ],
      },
    });

    map.addLayer({
      id: "humidity-points",
      type: "circle",
      source: "humidity",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 6,
          15, 10,
        ],
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          40, "#4575b4",
          65, "#e0f3f8",
          90, "#d727d7",
        ],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#000",
      },
    });

    map.on("click", "humidity-points", (e) => {
      const f = e.features?.[0];
      if (!f) return;

      new mapboxgl.Popup()
        .setLngLat(f.geometry.coordinates as [number, number])
        .setHTML(`<strong>Humidity:</strong> ${f.properties?.value.toFixed(1)}%`)
        .addTo(map);
    });

    // flyTo
    if (features.length > 0) {
      map.flyTo({
        center: features[0].geometry.coordinates,
        zoom: 13,
      });
    }
  },

  remove: (map: mapboxgl.Map) => {
    if (map.getLayer("humidity-points")) map.removeLayer("humidity-points");
    if (map.getLayer("humidity-heatmap")) map.removeLayer("humidity-heatmap");
    if (map.getSource("humidity")) map.removeSource("humidity");
  },
};
