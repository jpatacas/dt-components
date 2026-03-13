import type { State } from "../../../middleware/state";
import type { Action } from "../../../middleware/actions";
import type { Tool } from "../../../types";

import AddBuildingIcon from "@mui/icons-material/DomainAdd";
import LogoutIcon from "@mui/icons-material/Logout";
import AnalyticsIcon from "@mui/icons-material/Insights";

export function getMapTools(
  state: State,
  dispatch: React.Dispatch<Action>,
  toggleCreate: () => void,
): Tool[] {
  const mode = state.dtMode;

  const tools: Tool[] = [];

  tools.push({
    name: "Create building",
    icon: <AddBuildingIcon />,
    action: toggleCreate,
  });

  // Descriptive
  if (mode === "descriptive") {

  }

  // Diagnostic
  if (mode === "diagnostic") {
    tools.push({
      name: "District diagnostics",
      icon: <AnalyticsIcon />,
      action: () => console.log("diagnostics"),
    });
  }

  // Performance
  if (mode === "performance") {
    tools.push({
      name: "District performance",
      icon: <AnalyticsIcon />,
      action: () => console.log("performance"),
    });
  }

  tools.push({
    name: "Logout",
    icon: <LogoutIcon />,
    action: () => dispatch({ type: "LOGOUT" }),
  });

  return tools;
}
