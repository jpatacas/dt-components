import { type User } from "firebase/auth";
import type { Building, DTMode } from "../types";

export interface State {
    user: User | null;
    building : Building | null;
    dtMode: DTMode;
}

export const initialState: State = {
    user: null,
    building: null,
    dtMode: "descriptive",
}