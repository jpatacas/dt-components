import { type FC } from "react";
import { useAppContext } from "../../middleware/context-provider";
import { Button } from "@mui/material";

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
        <Button onClick={onLogout}>Logout</Button>
        </>
      ) : (
        <Button onClick={onLogin}>Login</Button>
      )}
    </h1>
  );
};
