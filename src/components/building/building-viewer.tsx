import { type FC, useEffect, useState } from "react"; //to define a component
import { Box, Button, CssBaseline } from "@mui/material";
import { useAppContext } from "../../middleware/context-provider";
import { Navigate } from "react-router-dom";
import { BuildingDrawer } from "./side-menu/building-drawer";
import { getDrawerHeader } from "../utils/mui-utils";
import { BuildingFrontMenu } from "./front-menu/building-front-menu";
import { type FrontMenuMode } from "./types";
import { BuildingViewport } from "./viewport/building-viewport";
import { NavBar } from "../navbar/navbar";
import { BottomDrawer } from "./bottom-menu/bottom-drawer";
import { getLayers } from "../layers/layer-registry";

export const BuildingViewer: FC = () => {
  //menus visibility
  const [sideOpen, setSideOpen] = useState(false);
  const [frontOpen, setFrontOpen] = useState(false);
  const [width] = useState(240); //from MUI
  const [frontMenu, setFrontMenu] = useState<FrontMenuMode>("BuildingInfo");

  const [state, dispatch] = useAppContext();
  const { user, building } = state;

  const [bottomOpen, setBottomOpen] = useState(false);

  //layers
  const layers = getLayers(state);

  const [selectedLayers, setSelectedLayers] = useState<
    Record<string, string | string[]>
  >({});

  useEffect(() => {
    if (!layers || layers.length === 0) return;

    const initialSelection: Record<string, string | string[]> = {};

    layers.forEach((group) => {
      if (group.selection === "single") {
        initialSelection[group.title] = group.layers[0]?.id || "";
      }

      if (group.selection === "multiple") {
        initialSelection[group.title] = [];
      }
    });

    setSelectedLayers(initialSelection);
  }, [state.dtMode]);

  const buildings: any[] = [];

  const districtKPIs = {
    buildings: buildings.length,
    models: buildings.reduce((sum, b) => sum + (b.models?.length || 0), 0),
  };

  const toggleBottomDrawer = () => {
    setBottomOpen((prev) => !prev);
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!building) {
    return <Navigate to={"/map"} />;
  }

  const toggleDrawer = (active: boolean) => {
    setSideOpen(active);
  };

  //for properties. building metadata
  const toggleFrontMenu = (active: boolean, mode?: FrontMenuMode) => {
    if (mode) {
      setFrontMenu(mode);
    }
    setFrontOpen(active);
  };

  const DrawerHeader = getDrawerHeader();

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <NavBar width={width} open={sideOpen} onOpen={() => toggleDrawer(true)} />

      <BuildingDrawer
        width={width}
        open={sideOpen}
        onClose={() => toggleDrawer(false)}
        onToggleMenu={toggleFrontMenu}
        layers={layers}
        selectedLayers={selectedLayers}
        setSelectedLayers={setSelectedLayers}
      />

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />

        <BuildingFrontMenu
          onToggleMenu={() => toggleFrontMenu(false)}
          open={frontOpen}
          mode={frontMenu}
        />

        <BuildingViewport />
      </Box>

      <BottomDrawer
        open={bottomOpen}
        toggleDrawer={toggleBottomDrawer}
        kpis={districtKPIs}
      />

      {!bottomOpen && (
        <Button
          variant="contained"
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
          }}
          onClick={toggleBottomDrawer}
        >
          Show Building KPIs
        </Button>
      )}
    </Box>
  );
};
