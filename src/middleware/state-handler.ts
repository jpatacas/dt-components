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

  if (action.type === "SET_SENSORS") {
    return {
      ...state,
      sensors: action.payload,
    };
  }
  return { ...state };
};
