export const ActionList = ["LOGIN",
"LOGOUT",
"START_MAP",
"REMOVE_MAP",
"UPDATE_USER",
"ADD_BUILDING",
"OPEN_BUILDING",
"CLOSE_BUILDING",
"UPDATE_BUILDING",
"DELETE_BUILDING",
"UPLOAD_MODEL",
"DELETE_MODEL",
"START_BUILDING",
"SET_DT_MODE",
"UPDATE_LAYERS_MAP",
"UPDATE_LAYERS_BUILDING",
"TOGGLE_FLOORPLAN",
"UPDATE_FLOORPLANS",
"UPDATE_PROPERTIES",
"SELECT_SENSOR",
"UPDATE_SENSOR_HISTORY",
"CLEAR_SENSOR_HISTORY",
"UPDATE_BUILDING_DASHBOARD"] as const;

export type ActionType = typeof ActionList[number]

export interface Action {
  type: ActionType;
  payload?: any; //optional , some actions don't have a payload
}
