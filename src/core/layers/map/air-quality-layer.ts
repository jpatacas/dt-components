export const airQualityLayer = {
  id: "aqi",
  label: "Air Quality Index",
  group: "Performance",
  selection: "single" as const,

  fetch: async () => {
    const base =
      "https://corsproxy.io/?https://api.v2.urbanobservatory.ac.uk";

    const [sensorsRes, dataRes] = await Promise.all([
      fetch(`${base}/sensors/json?limit=-1`),
      fetch(`${base}/sensors/data/json`),
    ]);

    const sensorsJson = await sensorsRes.json();
    const dataJson = await dataRes.json();

    const sensors = sensorsJson.Sensors;
    const readings = dataJson.Readings;

    console.log("Sensors:", sensors.length);
    console.log("Readings:", readings.length);

    const airSensors = sensors.filter((s: any) =>
      s.Sensor_Name?.includes("AIRMON")
    );

    const AIR_VARS = ["PM2.5", "PM10", "NO2", "NO"]; //also "PM 4"

      //const AIR_VARS = ["NO"];

    const airReadings = readings.filter(
      (r: any) =>
        AIR_VARS.includes(r.Variable) &&
        r.Sensor_Name?.includes("AIRMON") || r.Sensor_Name?.includes("AIRQUALITY")
    );

    console.log("Air sensors:", airSensors.length);
    console.log("Air sensors:", airSensors);
    console.log("Air readings:", airReadings.length);
    console.log("Air readings:", airReadings);

    const readingsMap = new Map<string, any>();

    airReadings.forEach((r: any) => {
      readingsMap.set(r.Sensor_Name, r);
    });

    const merged = airSensors
      .map((s: any) => {
        const reading = readingsMap.get(s.Sensor_Name);
        if (!reading) return null;

        return {
          ...s,
          value: reading.Value,
          variable: reading.Variable,
        };
      })
      .filter(Boolean);

    console.log("Merged sensors:", merged.length);
    console.log(merged)

    return merged;
  },

  add: (map: mapboxgl.Map, sensors: any[]) => {

    const features: GeoJSON.Feature<GeoJSON.Point>[] = sensors
      .map((s) => {
        const lng = s.Sensor_Centroid_Longitude;
        const lat = s.Sensor_Centroid_Latitude;
        const value = s.value;

        if (
          lng == null ||
          lat == null ||
          value == null ||
          isNaN(lng) ||
          isNaN(lat)
        ) {
          return null;
        }

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

    console.log("Heatmap features:", features.length);

    if (features.length === 0) {
      console.warn("No valid AQI features — skipping layer");
      return;
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    if (!map.getSource("air-quality")) {
      map.addSource("air-quality", {
        type: "geojson",
        data: geojson,
      });
    } else {
      const source = map.getSource(
        "air-quality"
      ) as mapboxgl.GeoJSONSource;
      source.setData(geojson);
    }

    if (!map.getLayer("air-quality-heatmap")) {
      map.addLayer({
        id: "air-quality-heatmap",
        type: "heatmap",
        source: "air-quality",
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
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            15,
            4,
          ],
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
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            5,
            15,
            40,
          ],
          "heatmap-opacity": 0.8,
        },
      });
    }

    map.flyTo({
      center: features[0]?.geometry.coordinates,
      zoom: 12,
    });
  },

  remove: (map: mapboxgl.Map) => {
    if (map.getLayer("air-quality-heatmap")) {
      map.removeLayer("air-quality-heatmap");
    }
    if (map.getSource("air-quality")) {
      map.removeSource("air-quality");
    }
  },
};