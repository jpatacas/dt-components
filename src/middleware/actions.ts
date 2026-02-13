export type ActionType = "LOGIN" | "UPDATE_USER";

export interface Action {
    type: ActionType;
    payload?: any; //optional , some actions don't have a payload
} 