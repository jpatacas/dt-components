import { useEffect, type FC } from "react";
import { useAppContext } from "./context-provider";
import { getAuth, onAuthStateChanged } from "firebase/auth";

let authInitialized = false;

//for user authentication in the app
export const Authenticator: FC = () => {
  const auth = getAuth();
  const dispatch = useAppContext()[1]; //gets the dispatch, 2nd element from context provider

  const listenToAuthChanges = () => {
    onAuthStateChanged(auth, (foundUser) => {
      const user = foundUser ? {...foundUser} : null;
      dispatch({ type: "UPDATE_USER", payload: user });
    });
  };

  useEffect(() => {
    if (!authInitialized) {
      listenToAuthChanges();
      authInitialized = true;
    }
  }, []);

  return <></>;
};
