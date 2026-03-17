const API = "https://corsproxy.io/?https://api.v2.urbanobservatory.ac.uk";

export const sensorHandler = {

  async fetch(events: any) {

    console.log("Fetching sensors...")
    const res = await fetch(`${API}/sensors/json?limit=-1`);

    const json = await res.json();

    console.log("API result", json)

    const sensors = json.Sensors.map((s: any) => ({

      name: s.Sensor_Name,
      lat: s.Sensor_Centroid_Latitude,
      lon: s.Sensor_Centroid_Longitude,
      broker: s.Broker_Name

    }));

    events.trigger({
      type: "SET_SENSORS",
      payload: sensors
    });
//console.log("Sensors loaded:", sensors.length);
  }

};