import { type FC } from "react";
import { useAppContext } from "../../middleware/context-provider";
import { Button } from "@mui/material";
import { Navigate } from "react-router-dom";

export const LoginForm: FC = () => {
  const [state, dispatch] = useAppContext(); //state and dispatch - need both?

  const onLogin = () => {
    dispatch({type: "LOGIN"});
  };



  if (state.user) {
    return <Navigate to = "/map"/>;
  }

  return (
    <h1>

        <Button onClick={onLogin}>Log in</Button>
  
    </h1>
  );
};
