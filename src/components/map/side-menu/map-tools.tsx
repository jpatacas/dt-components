import { type Action } from "../../../middleware/actions";
import { type State } from "../../../middleware/state";
import { type Tool } from "../../../types";
import AddBuildingIcon from "@mui/icons-material/DomainAdd";
import LogoutIcon from "@mui/icons-material/Logout";

export function getMapTools(
  state: State,
  dispatch: React.Dispatch<Action>,
  toggleMenu: (active: boolean) => void,
  toggleCreate: () => void
): Tool[] {
  return [
    {
      name: "Create Building",
      icon: <AddBuildingIcon />,
      action: () => {
        toggleCreate();
        toggleMenu(false);
      },
    },
    {
      name: "Logout",
      icon: <LogoutIcon />,
      action: () => {
        dispatch({ type: "LOGOUT" });
      },
    },
  ];
}