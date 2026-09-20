import { useState, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import {
  HomeIcon,
  CompassIcon,
  PlusIcon,
  MinusIcon,
  GpsIcon,
  BoxZoomIcon,
} from "../ui/Icons";
import { toast } from "sonner";

export interface MapNavigatorProps {
  homeCenter?: [number, number];
  homeZoom?: number;
}

export const MapNavigator: FC<MapNavigatorProps> = ({
  homeCenter = [51.389, 35.6892],
  homeZoom = 11,
}) => {
  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [isLocating, setIsLocating] = useState(false);
  const [isBoxZoom, setIsBoxZoom] = useState(false);

  const handleZoomIn = () => {
    if (map) map.zoomIn();
  };

  const handleZoomOut = () => {
    if (map) map.zoomOut();
  };

  const handleFlyHome = () => {
    if (map) {
      map.flyTo({
        center: homeCenter,
        zoom: homeZoom,
        pitch: 0,
        bearing: 0,
        essential: true,
      });
      toast.info("Returned to home view");
    }
  };

  const handleResetBearing = () => {
    if (map) {
      map.resetNorth({ duration: 500 });
      map.setPitch(0);
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { longitude, latitude } = pos.coords;
        if (map) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true,
          });
          toast.success("Located your position");
        }
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Geolocation error: ${err.message}`);
      },
      { timeout: 10000 }
    );
  };

  const handleToggleBoxZoom = () => {
    if (!map) return;
    const next = !isBoxZoom;
    setIsBoxZoom(next);

    if (next) {
      map.boxZoom?.enable();
      toast.info("Shift + drag on map to box-zoom");
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
        gap: "3px",
        width: "fit-content",
      }}
    >
      <button
        type="button"
        className="mlt-icon-btn"
        style={{ width: 32, height: 32 }}
        onClick={handleFlyHome}
        title="Fly to Home View"
      >
        <HomeIcon size={16} />
      </button>

      <button
        type="button"
        className="mlt-icon-btn"
        style={{ width: 32, height: 32 }}
        onClick={handleResetBearing}
        title="Reset North / Bearing"
      >
        <CompassIcon size={16} />
      </button>

      <div style={{ width: "70%", height: "1px", backgroundColor: "var(--mlt-border)", margin: "2px 0" }} />

      <button
        type="button"
        className="mlt-icon-btn"
        style={{ width: 32, height: 32 }}
        onClick={handleZoomIn}
        title="Zoom In"
      >
        <PlusIcon size={16} />
      </button>

      <button
        type="button"
        className="mlt-icon-btn"
        style={{ width: 32, height: 32 }}
        onClick={handleZoomOut}
        title="Zoom Out"
      >
        <MinusIcon size={16} />
      </button>

      <div style={{ width: "70%", height: "1px", backgroundColor: "var(--mlt-border)", margin: "2px 0" }} />

      <button
        type="button"
        className={`mlt-icon-btn ${isLocating ? "mlt-icon-btn-active" : ""}`}
        style={{ width: 32, height: 32 }}
        onClick={handleLocateUser}
        disabled={isLocating}
        title="Locate Me (GPS)"
      >
        <GpsIcon size={16} />
      </button>

      <button
        type="button"
        className={`mlt-icon-btn ${isBoxZoom ? "mlt-icon-btn-active" : ""}`}
        style={{ width: 32, height: 32 }}
        onClick={handleToggleBoxZoom}
        title={isBoxZoom ? "Shift+Drag enabled" : "Box Zoom (Shift + Drag)"}
      >
        <BoxZoomIcon size={16} />
      </button>
    </div>
  );
};

export default MapNavigator;
