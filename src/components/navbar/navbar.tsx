import { useState, type FC } from "react";
import { Outlet } from "react-router-dom";
import { getAppBar } from "../utils/mui-utils";
import {
  Toolbar,
  IconButton,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

export const NavBar: FC<{
  open: boolean;
  onOpen: () => void;
  width: number;
}> = (props) => {
  const { open, onOpen, width } = props;

  const Appbar = getAppBar(width);

  const [alignment, setAlignment] = useState("descriptive");

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string,
  ) => {
    setAlignment(newAlignment);
  };

  return (
    <>
      <Appbar position="fixed" open={open}>
        <Toolbar sx={{ position: "relative" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onOpen}
            edge="start"
            sx={{ marginRight: 5, ...(open && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            DT Components
          </Typography>
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <ToggleButtonGroup
              value={alignment}
              exclusive
              onChange={handleChange}
              sx={{
                "& .MuiToggleButton-root": {
                  color: "white",
                  borderColor: "rgba(255,255,255,0.2)",

                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.15)",
                  },
                },
              }}
              aria-label="DT mode"
            >
              <ToggleButton value="descriptive">Descriptive</ToggleButton>
              <ToggleButton value="diagnostic">Diagnostic</ToggleButton>
              <ToggleButton value="performance">Performance</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Toolbar>
      </Appbar>
      <Outlet />
    </>
  );
};
