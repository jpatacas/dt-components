import { useEffect, useRef, useState, type FC } from "react";
import { useAppContext } from "../../middleware/context-provider";
import { Navigate } from "react-router-dom";
import { Button } from "@mui/material";
import "./map-viewer.css";
import { NavBar } from "../navbar/navbar";
import { Drawer } from "./side-menu/drawer";
import type { Tool } from "../../types";
import { DistrictDashboard } from "./bottom-menu/district-dashboard";
import { getLayers } from "../layers/layer-registry";

export const MapViewer: FC = () => {
  const containerRef = useRef(null);
  const [isCreating, setIsCreating] = useState(false); // determine if user is creating a building
  const [tools, setTools] = useState<Tool[]>([]);

  const [state, dispatch] = useAppContext();
  const { user, building } = state;

  const [width] = useState(240);
  const [sideOpen, setSideOpen] = useState(false);

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
      if (group.title === "Descriptive") {
        initialSelection[group.title] = "buildings";
      }
      if (group.selection === "single") {
        initialSelection[group.title] = group.layers[0]?.id || "";
      }

      if (group.selection === "multiple") {
        initialSelection[group.title] = [];
      }
    });

    setSelectedLayers(initialSelection);
  }, [state.dtMode]);

  useEffect(() => {
    const selected = Object.values(selectedLayers).flat().filter(Boolean);

    dispatch({
      type: "UPDATE_LAYERS_MAP",
      payload: selected,
    });
  }, [selectedLayers]);

  const buildings: any[] = [];

  const districtKPIs = {
    buildings: buildings.length,
    models: buildings.reduce((sum, b) => sum + (b.models?.length || 0), 0),
  };

  const toggleDrawer = (active: boolean) => {
    setSideOpen(active);
  };

  const toggleBottomDrawer = () => {
    setBottomOpen((prev) => !prev);
  };

  const toggleFrontMenu = () => {};

  const onToggleCreate = () => {
    setIsCreating(!isCreating);
  };

  const onCreate = () => {
    if (isCreating) {
      dispatch({ type: "ADD_BUILDING", payload: user });
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container && user) {
      dispatch({ type: "START_MAP", payload: { container, user } }); //load buildings per user
    }

    return () => {
      //called when component is destroyed
      dispatch({ type: "REMOVE_MAP" });
    };
  }, []);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (building) {
    const url = `/building?id=${building.uid}`;
    return <Navigate to={url} />;
  }

  // const onLogout = () => {
  //   dispatch({ type: "LOGOUT" });
  // };

  return (
    <>
      <NavBar width={width} open={sideOpen} onOpen={() => toggleDrawer(true)} />

      <Drawer
        width={width}
        open={sideOpen}
        onClose={() => toggleDrawer(false)}
        onToggleMenu={toggleFrontMenu}
        toggleCreate={onToggleCreate}
        tools={tools}
        layers={layers}
        selectedLayers={selectedLayers}
        setSelectedLayers={setSelectedLayers}
        isCreating={isCreating}
      />

      <div
        onContextMenu={onCreate}
        className="full-screen"
        ref={containerRef}
      />
      {isCreating && (
        <div className="overlay">
          <p>Right click to create a new Building or</p>
          <Button onClick={onToggleCreate}>cancel</Button>
        </div>
      )}
      {/* <div className="gis-button-container">
        <Button variant="contained" onClick={onToggleCreate}>
          Create building
        </Button>
        <Button variant="contained" onClick={onLogout}>
          Log out
        </Button>
      </div> */}

      <DistrictDashboard
        open={bottomOpen}
        toggleDrawer={toggleBottomDrawer}
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
          Show District Dashboard
        </Button>
      )}
    </>
  );
};
