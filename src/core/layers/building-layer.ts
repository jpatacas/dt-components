import type { Building } from "../../types";

export const buildingLayer = {
  id: "buildings",

  add(map: mapboxgl.Map, data: Building[]) {
    if (!map.getSource("user-buildings")) {
      map.addSource("user-buildings", {
        type: "geojson",
        data: toGeoJSON(data),
      });

      map.addLayer({
        id: "user-buildings-layer",
        type: "circle",
        source: "user-buildings",
        paint: {
          "circle-radius": 6,
          "circle-color": "#0077ff",
        },
      });
    } else {
      const source = map.getSource("user-buildings") as mapboxgl.GeoJSONSource;
      source.setData(toGeoJSON(data));
    }
    map.flyTo({
      center: [-1.6246925540216892, 54.972387334931994], //Helix (hardcoded)
      zoom: 16.5,
    });
  },

  update(map: mapboxgl.Map, data: Building[]) {
    const source = map.getSource("user-buildings") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(toGeoJSON(data));
    }
  },

  remove(map: mapboxgl.Map) {
    if (map.getLayer("user-buildings-layer")) {
      map.removeLayer("user-buildings-layer");
    }
    if (map.getSource("user-buildings")) {
      map.removeSource("user-buildings");
    }
  },
};

function toGeoJSON(buildings: Building[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: buildings.map((b) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [b.lng, b.lat],
      },
      properties: {
        uid: b.uid,
      },
    })),
  };
}
