import { useState, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { Popover } from "../ui/Popover";
import { GpsIcon, FlightIcon } from "../ui/Icons";
import type { ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface GoToControlProps {
  config?: ToolConfig;
}

export const GoToControl: FC<GoToControlProps> = () => {
  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [zoom, setZoom] = useState("14");

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFlyTo = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(lat.trim());
    const lngNum = parseFloat(lng.trim());
    const zoomNum = parseFloat(zoom.trim()) || 14;

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.error("Please enter a valid Latitude (-90 to 90)");
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.error("Please enter a valid Longitude (-180 to 180)");
      return;
    }

    if (map) {
      map.flyTo({
        center: [lngNum, latNum],
        zoom: zoomNum,
        essential: true,
      });
      toast.success(`Navigating to [${latNum.toFixed(4)}, ${lngNum.toFixed(4)}]`);
      handleClose();
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${open ? "mlt-icon-btn-active" : ""}`}
        onClick={handleClick}
        title="Go to Coordinates"
      >
        <GpsIcon size={18} />
      </button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        width={240}
      >
        <form onSubmit={handleFlyTo} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Fly to Coordinates</div>

          <div className="mlt-form-group">
            <label className="mlt-label">Latitude</label>
            <input
              type="text"
              className="mlt-input"
              placeholder="e.g. 35.6892"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mlt-form-group">
            <label className="mlt-label">Longitude</label>
            <input
              type="text"
              className="mlt-input"
              placeholder="e.g. 51.3890"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>

          <div className="mlt-form-group">
            <label className="mlt-label">Zoom Level</label>
            <input
              type="number"
              className="mlt-input"
              min={1}
              max={22}
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="mlt-btn mlt-btn-primary"
            style={{ marginTop: "4px", width: "100%", justifyContent: "center" }}
          >
            <FlightIcon size={14} /> Go to Location
          </button>
        </form>
      </Popover>
    </>
  );
};

export default GoToControl;
