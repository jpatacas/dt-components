import { userAuth } from "../core/user-auth";
import type { Action } from "./actions";

export const executeCore = (action:Action) => {
    if (action.type === "LOGIN")
    {
        userAuth.login(action);
        //userAuth.login();
    }
}