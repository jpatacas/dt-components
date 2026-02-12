import { useEffect, type FC } from "react";
import { useAppContext } from "./context-provider";

let authInitialized = false;

//for user authentication in the app
export const Authenticator: FC = () => {
  //get auth from database
  const dispatch = useAppContext()[1]; //gets the dispatch, 2nd element from context provider

  const listenToAuthChanges = () => {
    //implement  a function for mongoDB or other database
    const user = null; //user = foundUser or null
    dispatch({ type: "UPDATE_USER", payload: user });
  };

  useEffect(() => {
    if (!authInitialized) {
      listenToAuthChanges();
      authInitialized = true;
    }
  }, []);

  return <></>;
};
