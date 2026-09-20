import { useState, useEffect, type FC } from "react";
import { FullscreenIcon, FullscreenExitIcon } from "../ui/Icons";
import { toast } from "sonner";

export const MapViewControl: FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      className="mlt-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "4px",
        width: "fit-content",
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
