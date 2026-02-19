import { type User } from "firebase/auth";
import type { Building } from "../types";

export interface State {
    user: User | null;
    building : Building | null;
}

export const initialState: State = {
    user: null,
    building: null
}