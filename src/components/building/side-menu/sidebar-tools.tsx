import { type Action } from "../../../middleware/actions";
import { type State } from "../../../middleware/state";
import { type Tool } from "../../../types";
import { type FrontMenuMode } from "../types";
import ListIcon from "@mui/icons-material/ViewList";
import MapIcon from "@mui/icons-material/Map";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import ModelIcon from "@mui/icons-material/HolidayVillage";
import AnalyticsIcon from "@mui/icons-material/Insights";

export function getSidebarTools(
  state: State,
  dispatch: React.Dispatch<Action>,
  toggleMenu: (active: boolean, mode?: FrontMenuMode) => void,
): Tool[] {
  const tools: Tool[] = [];

  tools.push(
    {
      name: "Info",
      icon: <ListIcon />,
      action: () => toggleMenu(true, "BuildingInfo"),
    },
    {
      name: "Model list",
      icon: <ModelIcon />,
      action: () => toggleMenu(true, "ModelList"),
    },
  );

  if (state.dtMode === "diagnostic") {
    tools.push({
      name: "Diagnostics",
      icon: <AnalyticsIcon />,
      action: () => console.log("diagnostics"),
    });
  }

  if (state.dtMode === "performance") {
    tools.push({
      name: "Performance",
      icon: <AnalyticsIcon />,
      action: () => console.log("performance"),
    });
  }

  tools.push(
    {
      name: "Back to map",
      icon: <MapIcon />,
      action: () => dispatch({ type: "CLOSE_BUILDING" }),
    },
    {
      name: "Logout",
      icon: <LogoutIcon />,
      action: () => dispatch({ type: "LOGOUT" }),
    },
  );

  tools.push({
    name: "Delete building",
    icon: <DeleteIcon />,
    action: () =>
      dispatch({ type: "DELETE_BUILDING", payload: state.building }),
  });

  return tools;
}
