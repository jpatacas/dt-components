import { type Action } from "../middleware/actions";

export const userAuth = {
  login: (action: Action) => {
    if (action.payload) {
      console.log(`User ${action.payload.displayName} logged`);
    } else {
      console.log("No user logged");
    }

    //authentication to db
    //const auth = getAuth() etc
    // ...
    //sign in...

  },
};
