import { type FC } from "react";
import { useTheme } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Sidebar } from "./sidebar";
import { getDrawer, getDrawerHeader } from "../../utils/mui-utils"


export const Drawer: FC<{
  open: boolean;
  width: number;
  onToggleMenu: (active?: boolean) => void;
  onClose: () => void;
  toggleCreate: () => void;
  tools: Array<{
    name: string;
    icon: React.ReactNode;
    action: Function;
  }>;
  isCreating: boolean;
}> = (props) => {
  const theme = useTheme();

  const { open, width: drawerWidth, onClose, onToggleMenu, toggleCreate, tools } = props;

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
      <Sidebar onToggleMenu={onToggleMenu} open={open} toggleCreate = {toggleCreate} tools={tools}/>
      <Divider />
    </Drawer>
  );
};