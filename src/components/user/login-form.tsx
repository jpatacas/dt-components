import { useState, type FC } from "react";
import { useAppContext } from "../../middleware/context-provider";
import { AppBar, Box, Button, Card, CardContent, Tab, Tabs, TextField, Toolbar, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
//import { NavBar } from "../navbar/navbar";

export const LoginForm: FC = () => {
  const [state, dispatch] = useAppContext(); //state and dispatch - need both?
   const [activeTab, setActiveTab] = useState(0);

  const onLogin = () => {
    dispatch({type: "LOGIN"});
  };

  const onSignUp = () => {
   // dispatch({ type: "SIGNUP" });
   console.log("Sign up")
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (state.user) {
    return <Navigate to = "/map"/>;
  }

  return (
    <>
    {/* <NavBar open={false} onOpen={() => {}} width={100} /> */}
        {/* <Button onClick={onLogin}>Log in</Button> */}

      <AppBar position="static">
        <Toolbar>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DT Components
          </Typography>
 
        </Toolbar>
      </AppBar>

            <Card sx={{ maxWidth: 400, margin: "0 auto", marginTop: 20 }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>


        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Login" />
          <Tab label="Sign Up" />
        </Tabs>

        {activeTab === 0 && (
          <>
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              margin="normal"
              fullWidth
              // Add necessary props and event handlers for email input
            />

            <TextField
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              fullWidth
              // Add necessary props and event handlers for password input
            />
            <Box sx={{ width: "100%", marginTop: 2}}>
            <Button variant="contained" color="primary" onClick={onLogin} fullWidth>
              Login
            </Button>
            </Box>

            <Box sx={{ width: "100%", marginTop: 2}}>
            <Button variant="contained" color="secondary" onClick={onLogin} fullWidth>
              Login with Google
            </Button>
            </Box>
          </>
        )}

        {activeTab === 1 && (
          <>
            {/* Add sign-up form fields and button */}
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              margin="normal"
              fullWidth
              // Add necessary props and event handlers for email input
            />

            <TextField
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              fullWidth
              // Add necessary props and event handlers for password input
            />
            <Box sx={{ width: "100%", marginTop: 2}}>
            <Button variant="contained" color="primary" onClick={onSignUp} fullWidth>
              Sign Up
            </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  
    </>
  );
};
