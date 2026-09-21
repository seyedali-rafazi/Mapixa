import { useState, useEffect, type FC } from "react";
import { FullscreenIcon, FullscreenExitIcon } from "../ui/Icons";
import { toast } from "sonner";
import { isDarkColor } from "../../utils/colorUtils";

export interface MapViewControlProps {
  backgroundColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const MapViewControl: FC<MapViewControlProps> = ({
  backgroundColor,
  style,
  className = "",
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = isDarkColor(backgroundColor);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        toast.error(`Error exiting fullscreen: ${err.message}`);
      });
    }
  };

  return (
    <div
      className={`mlt-panel mlt-view-control ${isDark ? "mlt-dark" : ""} ${className}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "4px",
        width: "fit-content",
        ...(backgroundColor ? { background: backgroundColor } : {}),
        ...style,
      }}
    >
      <button
        type="button"
        className={`mlt-icon-btn ${isFullscreen ? "mlt-icon-btn-active" : ""}`}
        style={{ width: 32, height: 32 }}
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <FullscreenExitIcon size={16} />
        ) : (
          <FullscreenIcon size={16} />
        )}
      </button>
    </div>
  );
};

export default MapViewControl;
