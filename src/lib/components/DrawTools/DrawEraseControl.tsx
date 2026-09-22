import { type FC } from "react";
import { Eraser } from "lucide-react";
import { useDrawLayers } from "../../context/DrawLayersContext";
import type { ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface DrawEraseControlProps {
  config?: ToolConfig;
}

export const DrawEraseControl: FC<DrawEraseControlProps> = () => {
  const {
    drawnLayers,
    isEraserMode,
    toggleEraserMode,
  } = useDrawLayers();

  const handleClick = () => {
    const nextState = !isEraserMode;
    toggleEraserMode();

    if (nextState) {
      toast.info("Eraser active. Click any shape on the map to delete it.");
    }
  };

  return (
    <button
      type="button"
      className={`mlt-icon-btn ${isEraserMode ? "mlt-icon-btn-active" : ""}`}
      onClick={handleClick}
      title={
        isEraserMode
          ? "Eraser Tool Active (Click any shape to delete it)"
          : `Erase Shapes (${drawnLayers.length} drawn)`
      }
      style={
        isEraserMode
          ? {
              backgroundColor: "rgba(255, 59, 48, 0.2)",
              color: "var(--mlt-danger, #ff3b30)",
              borderColor: "rgba(255, 59, 48, 0.4)",
            }
          : undefined
      }
    >
      <Eraser size={18} />
    </button>
  );
};

export default DrawEraseControl;
