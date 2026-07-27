import mapboxgl from "mapbox-gl";
import type { UrbanSensor } from "../../../types";

export const airQualityLayer = {
  id: "aqi",
  label: "Air Quality Index",
  group: "Performance",
  selection: "single" as const,

  add: (map: mapboxgl.Map, sensors: UrbanSensor[]) => {
    const features = sensors
      .map((sensor) => {
        // Only AIRMON / AIRQUALITY stations
        if (
          !sensor.Sensor_Name?.includes("AIRMON") &&
          !sensor.Sensor_Name?.includes("AIRQUALITY")
        ) {
          return null;
        }

        const lng = sensor.Sensor_Centroid_Longitude;
        const lat = sensor.Sensor_Centroid_Latitude;

        if (lng == null || lat == null) return null;

        //-------------------------------------------------
        // Compute a simple AQI score
        //-------------------------------------------------

        const pm25 = sensor.values["PM2.5"]?.Value;
        const pm10 = sensor.values["PM10"]?.Value;
        const no2 = sensor.values["NO2"]?.Value;
        const no = sensor.values["NO"]?.Value;

        const pollutants = [pm25, pm10, no2, no].filter(
          (v): v is number => v != null,
        );

        if (pollutants.length === 0) return null;

        // Simple proxy: worst pollutant
        const value = Math.max(...pollutants);

        return {
          type: "Feature",

          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },

          //check API documentation for units?
          properties: {
            name: sensor.Sensor_Name,

            pm25: pm25 ?? null,
            pm25Unit: sensor.values["PM2.5"]?.Unit ?? "µg/m³",

            pm10: pm10 ?? null,
            pm10Unit: sensor.values["PM10"]?.Unit ?? "µg/m³",

            no2: no2 ?? null,
            no2Unit: sensor.values["NO2"]?.Unit ?? "µg/m³",

            no: no ?? null,
            noUnit: sensor.values["NO"]?.Unit ?? "µg/m³",

            value,
          },
        };
      })
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null);

    console.log("AQI sensors:", features.length);

    if (features.length === 0) return;

    //-------------------------------------------------
    // Source
    //-------------------------------------------------

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
      (map.getSource("air-quality") as mapboxgl.GeoJSONSource).setData(geojson);
    }

    //-------------------------------------------------
    // Heatmap
    //-------------------------------------------------

    if (!map.getLayer("air-quality-heatmap")) {
      map.addLayer({
        id: "air-quality-heatmap",

        type: "heatmap",

        source: "air-quality",

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

          "heatmap-intensity": [
            "interpolate",

            ["linear"],

            ["zoom"],

            0,
            1,

            15,
            5,
          ],

          "heatmap-color": [
            "interpolate",

            ["linear"],

            ["heatmap-density"],

            0.0,
            "rgba(0,255,0,0)",

            0.2,
            "#00c853",

            0.4,
            "#64dd17",

            0.6,
            "#ffd600",

            0.8,
            "#ff6d00",

            1.0,
            "#d50000",
          ],

          "heatmap-radius": [
            "interpolate",

            ["linear"],

            ["zoom"],

            0,
            120,

            8,
            110,

            12,
            90,

            15,
            60,
          ],

          "heatmap-opacity": 0.85,
        },
      });
    }

    //-------------------------------------------------
    // Sensor points
    //-------------------------------------------------

    if (!map.getLayer("air-quality-points")) {
      map.addLayer({
        id: "air-quality-points",

        type: "circle",

        source: "air-quality",

        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 8, 15, 12],

          "circle-color": [
            "interpolate",

            ["linear"],

            ["get", "value"],

            0,
            "#00c853",

            25,
            "#64dd17",

            50,
            "#ffd600",

            75,
            "#ff6d00",

            100,
            "#d50000",
          ],

          "circle-stroke-width": 1.5,

          "circle-stroke-color": "#222",
        },
      });
    }

    map.on("click", "air-quality-points", (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const p = feature.properties!;

      const format = (value: any, unit: string) =>
        value == null ? "--" : `${Number(value).toFixed(2)} ${unit}`;

      new mapboxgl.Popup()
        .setLngLat(
          (feature.geometry as GeoJSON.Point).coordinates as [number, number],
        )
        .setHTML(
          `
      <b>${p.name}</b><br/><br/>

      <table style="border-collapse:collapse;">
        <tr>
          <td><b>PM2.5</b></td>
          <td style="padding-left:12px">${format(p.pm25, p.pm25Unit)}</td>
        </tr>
        <tr>
          <td><b>PM10</b></td>
          <td style="padding-left:12px">${format(p.pm10, p.pm10Unit)}</td>
        </tr>
        <tr>
          <td><b>NO₂</b></td>
          <td style="padding-left:12px">${format(p.no2, p.no2Unit)}</td>
        </tr>
        <tr>
          <td><b>NO</b></td>
          <td style="padding-left:12px">${format(p.no, p.noUnit)}</td>
        </tr>
      </table>
    `,
        )
        .addTo(map);
    });

    map.on("mouseenter", "air-quality-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "air-quality-points", () => {
      map.getCanvas().style.cursor = "";
    });

    //-------------------------------------------------
    // Fly to first station
    //-------------------------------------------------

    map.flyTo({
      center: features[0].geometry.coordinates,

      zoom: 12,
    });
  },

  remove: (map: mapboxgl.Map) => {
    if (map.getLayer("air-quality-points"))
      map.removeLayer("air-quality-points");

    if (map.getLayer("air-quality-heatmap"))
      map.removeLayer("air-quality-heatmap");

    if (map.getSource("air-quality")) map.removeSource("air-quality");
  },
};
