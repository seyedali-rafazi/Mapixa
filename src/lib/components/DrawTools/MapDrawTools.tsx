import type { FC } from "react";
import { DrawIcon } from "../ui/Icons";
import ExpandableBox from "../ExpandableBox";
import DrawMarkerControl from "./DrawMarkerControl";
import DrawLineControl from "./DrawLineControl";
import FreeDrawControl from "./FreeDrawControl";
import DrawRectangleControl from "./DrawRectangleControl";
import DrawPolygonControl from "./DrawPolygonControl";
import DrawCircleControl from "./DrawCircleControl";
import IntersectionControl from "./IntersectionControl";
import type { ToolsConfiguration, ExtraActionItem } from "../../types/tools";

export interface MapDrawToolsProps {
  id?: string;
  config?: ToolsConfiguration;
  extraActions?: ExtraActionItem[];
}

export const MapDrawTools: FC<MapDrawToolsProps> = ({
  id = "draw",
  config,
  extraActions,
}) => {
  return (
    <ExpandableBox
      id={id}
      accordionText="DRAW"
      accordionIcon={<DrawIcon size={18} />}
    >
      {config?.marker?.visible !== false && (
        <DrawMarkerControl
          config={config?.marker}
          extraActions={extraActions}
        />
      )}
      {config?.line?.visible !== false && (
        <DrawLineControl
          config={config?.line}
          extraActions={extraActions}
        />
      )}
      {config?.freedraw?.visible !== false && (
        <FreeDrawControl
          config={config?.freedraw}
          extraActions={extraActions}
        />
      )}
      {config?.rectangle?.visible !== false && (
        <DrawRectangleControl
          config={config?.rectangle}
          extraActions={extraActions}
        />
      )}
      {config?.polygon?.visible !== false && (
        <DrawPolygonControl
          config={config?.polygon}
          extraActions={extraActions}
        />
      )}
      {config?.circle?.visible !== false && (
        <DrawCircleControl
          config={config?.circle}
          extraActions={extraActions}
        />
      )}
      {config?.line?.visible !== false && (
        <IntersectionControl
          config={config?.line}
          extraActions={extraActions}
        />
      )}
    </ExpandableBox>
  );
};

export default MapDrawTools;
