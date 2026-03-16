import { type FC } from "react";
import { useTheme } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { BuildingSidebar } from "./building-sidebar";
import { getDrawer, getDrawerHeader } from "../../utils/mui-utils";
import { type FrontMenuMode } from "../types";
import { LayerSelector } from "../../layers/layer-selector";

export const BuildingDrawer: FC<{
  open: boolean;
  width: number;
  onToggleMenu: (active: boolean, mode?: FrontMenuMode) => void;
  onClose: () => void;
  layers: any[];
  selectedLayers: Record<string, string>;
  setSelectedLayers: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}> = (props) => {
  const theme = useTheme();

  const {
    open,
    width: drawerWidth,
    onClose,
    onToggleMenu,
    layers,
    selectedLayers,
    setSelectedLayers,
  } = props;

  const Drawer = getDrawer(drawerWidth);
  const DrawerHeader = getDrawerHeader();

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <IconButton onClick={onClose}>
          {theme.direction === "rtl" ? (
            <ChevronRightIcon />
          ) : (
            <ChevronLeftIcon />
          )}
        </IconButton>
      </DrawerHeader>
      <BuildingSidebar onToggleMenu={onToggleMenu} open={open} />
      <Divider />
      <LayerSelector
        open={open}
        layers={layers}
        selectedLayers={selectedLayers}
        setSelectedLayers={setSelectedLayers}
      />
    </Drawer>
  );
};
