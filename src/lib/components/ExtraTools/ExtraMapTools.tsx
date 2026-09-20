import type { FC } from "react";
import { ToolsIcon } from "../ui/Icons";
import ExpandableBox from "../ExpandableBox";
import GoToControl from "./GoToControl";
import DrawRulerControl from "./DrawRulerControl";
import CaptureAreaControl from "./CaptureAreaControl";
import ImageOverlayControl from "./ImageOverlayControl";
import type { ToolsConfiguration, ExtraActionItem } from "../../types/tools";

export interface ExtraMapToolsProps {
  id?: string;
  config?: ToolsConfiguration;
  extraActions?: ExtraActionItem[];
}

export const ExtraMapTools: FC<ExtraMapToolsProps> = ({
  id = "tool",
  config,
  extraActions,
}) => {
  return (
    <ExpandableBox
      id={id}
      accordionText="TOOL"
      accordionIcon={<ToolsIcon size={18} />}
    >
      {config?.goto?.visible !== false && <GoToControl config={config?.goto} />}
      {config?.ruler?.visible !== false && (
        <DrawRulerControl config={config?.ruler} extraActions={extraActions} />
      )}
      {config?.capture?.visible !== false && (
        <CaptureAreaControl config={config?.capture} extraActions={extraActions} />
      )}
      {config?.overlay?.visible !== false && (
        <ImageOverlayControl config={config?.overlay} extraActions={extraActions} />
      )}
    </ExpandableBox>
  );
};

export default ExtraMapTools;
