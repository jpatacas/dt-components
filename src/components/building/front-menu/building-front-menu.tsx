import { Button, Card, CardContent } from "@mui/material";
import { type FC } from "react";
import "./building-front-menu.css";
import CloseIcon from "@mui/icons-material/Close";
import { BuildingInfoMenu } from "./front-menu-content/building-info-menu";
import type { FrontMenuMode } from "../types";
import { ModelListMenu } from "./front-menu-content/model-list-menu";
import { FloorplanMenu } from "./front-menu-content/floorplan-menu";
import { PropertiesMenu } from "./front-menu-content/properties-menu";

//export type FrontMenuMode = "BuildingInfo"; // if mode == properties, display properties etc...

export const BuildingFrontMenu: FC<{
  mode: FrontMenuMode;
  open: boolean;
  onToggleMenu: (active: boolean) => void;
}> = ({ mode, open, onToggleMenu }) => {
  if (!open) {
    return <></>;
  }

  const content = new Map<FrontMenuMode, any>();
  content.set("BuildingInfo", <BuildingInfoMenu onToggleMenu={onToggleMenu} />);
  content.set("ModelList", <ModelListMenu />);
  content.set("Properties", <PropertiesMenu/>);
  content.set("Floorplans", <FloorplanMenu/>);

  const titles = {
    BuildingInfo: "Building Information",
    ModelList: "Model List",
    Properties: "Properties",
    Floorplans: "Floor plans"
  };

  const title = titles[mode];

  return (
    <Card className="front-menu bottom-right">
      <CardContent>
        <div className="front-menu-header">
          <h2>{title}</h2>
          <Button onClick={() => onToggleMenu(false)}>
            <CloseIcon />
          </Button>
        </div>
        <div className="front-menu-content">{content.get(mode)}</div>
      </CardContent>
    </Card>
  );
};
