import { type FC } from "react";
import { useAppContext } from "../../middleware/context-provider";

export const LoginForm: FC = () => {
  const [state, dispatch] = useAppContext(); //state and dispatch - need both?

  const onLogin = () => {
    dispatch({type: "LOGIN"});
  };

  const onLogout = () => {
    dispatch({type: "LOGOUT"});
  };

  return (
    <h1>
      {state.user ? (
        <>
        <p>{state.user.displayName}</p>
        <button onClick={onLogout}>Logout</button>
        </>
      ) : (
        <button onClick={onLogin}>Login</button>
      )}
    </h1>
  );
};
