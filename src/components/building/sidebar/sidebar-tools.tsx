import { type Action } from "../../../middleware/actions";
import { type State } from "../../../middleware/state";
import { type Tool } from "../../../types";
import ListIcon from "@mui/icons-material/ViewList";
import MapIcon from "@mui/icons-material/Map";

export function getSidebarTools(
  state: State,
  dispatch: React.Dispatch<Action>,
  toggleMenu: () => void,
): Tool[] {
  return [
    {
      name: "Info",
      icon: <ListIcon />,
      action: () => {
        toggleMenu();
      },
    },
    {
      name: "Back to map",
      icon: <MapIcon />,
      action: () => {
        dispatch({ type: "CLOSE_BUILDING" });
      },
    },
  ];
}
