import { type FC } from "react";
import { useAppContext } from "../../middleware/context-provider";

export const LoginForm: FC = () => {
  const [state, dispatch] = useAppContext(); //state and dispatch - need both?

  const onLogin = () => {
    console.log("logging in");
    dispatch({type: "LOGIN"}) //login
  };

  return (
    <h1>
      {state.user ? (
        <p>{state.user.displayName}</p>
      ) : (
        <button onClick={onLogin}>Login</button>
      )}
    </h1>
  );
};
