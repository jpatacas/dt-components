import type { Action } from "./actions";
import type { State } from "./state";

export const reducer = (state: State, action: Action) => {
  if (action.type === "UPDATE_USER") {
    return { ...state, user: action.payload };
  }
  if (action.type === "OPEN_BUILDING" || action.type === "UPDATE_BUILDING") {
    return { ...state, building: action.payload };
  }
  if (action.type === "CLOSE_BUILDING") {
    return { ...state, building: null };
  }

  if (action.type === "SET_DT_MODE") {
    return { ...state, dtMode: action.payload };
  }

  if (
    action.type === "UPDATE_LAYERS_MAP" ||
    action.type === "UPDATE_LAYERS_BUILDING"
  ) {
    return {
      ...state,
      activeLayers: action.payload,
    };
  }
  if (action.type === "UPDATE_FLOORPLANS") {
    return { ...state, floorplans: action.payload };
  }
  if (action.type === "UPDATE_PROPERTIES") {
    return { ...state, properties: action.payload };
  }
  if (action.type === "SELECT_SENSOR") {
    //console.log(action.payload);
    return {
      ...state,
      selectedSensor: action.payload,
    };
  }
  if (action.type === "UPDATE_SENSOR_HISTORY") {
   console.log(state);
    return {
      ...state,
      sensorHistory: action.payload.history,
      selectedSensor: action.payload.sensor,
    };
  }
  return { ...state };
};
