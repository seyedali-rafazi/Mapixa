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
import DrawEraseControl from "./DrawEraseControl";
import DrawLayerManagerControl from "./DrawLayerManagerControl";
import type { ToolsConfiguration, ExtraActionItem } from "../../types/tools";

export interface MapDrawToolsProps {
  id?: string;
  config?: ToolsConfiguration;
  extraActions?: ExtraActionItem[];
  accordionBackground?: string;
  backgroundColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const MapDrawTools: FC<MapDrawToolsProps> = ({
  id = "draw",
  config,
  extraActions,
  accordionBackground,
  backgroundColor,
  style,
  className,
}) => {
  return (
    <ExpandableBox
      id={id}
      accordionText="DRAW"
      accordionIcon={<DrawIcon size={18} />}
      backgroundColor={accordionBackground ?? backgroundColor}
      style={style}
      className={className}
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
      {(config?.intersection?.visible ?? config?.line?.visible) !== false && (
        <IntersectionControl
          config={config?.intersection ?? config?.line}
          extraActions={extraActions}
        />
      )}
      <div className="mlt-divider" />
      {config?.erase?.visible !== false && (
        <DrawEraseControl config={config?.erase} />
      )}
      {config?.layerManager?.visible !== false && (
        <DrawLayerManagerControl config={config?.layerManager} />
      )}
    </ExpandableBox>
  );
};

export default MapDrawTools;
