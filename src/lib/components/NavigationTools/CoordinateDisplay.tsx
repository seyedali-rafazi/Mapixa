import { useState, useEffect, useCallback, type FC } from "react";
import { useMap, Popup } from "react-map-gl/maplibre";
import { CopyIcon } from "../ui/Icons";
import { copyToClipboard } from "../../utils/exportUtils";
import { isDarkColor } from "../../utils/colorUtils";
import { toast } from "sonner";

export interface CoordinateDisplayProps {
  precision?: number;
  showCopyButton?: boolean;
  backgroundColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const CoordinateDisplay: FC<CoordinateDisplayProps> = ({
  precision = 5,
  showCopyButton = true,
  backgroundColor,
  style,
  className = "",
}) => {
  const isDark = isDarkColor(backgroundColor);
  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [coords, setCoords] = useState<{
    lng: string;
    lat: string;
    rawLng: number;
    rawLat: number;
  } | null>(null);

  const [isPicking, setIsPicking] = useState(false);

  useEffect(() => {
    if (!map) return;

    const handleMouseMove = (e: any) => {
      const { lng, lat } = e.lngLat;
      setCoords({
        lng: lng.toFixed(precision),
        lat: lat.toFixed(precision),
        rawLng: lng,
        rawLat: lat,
      });
    };

    const handleMouseOut = () => setCoords(null);

    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseOut);

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseOut);
    };
  }, [map, precision]);

  const handleMapClick = useCallback(
    (e: any) => {
      const { lng, lat } = e.lngLat;
      const text = `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;

      copyToClipboard(text).then(() => {
        toast.success(`Copied coordinates: ${text}`);
      });

      setIsPicking(false);
      if (e.target?.getCanvas) {
        e.target.getCanvas().style.cursor = "";
      }
    },
    [precision]
  );

  useEffect(() => {
    if (!map) return;

    if (isPicking) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleMapClick);
    } else {
      map.getCanvas().style.cursor = "";
      map.off("click", handleMapClick);
    }

    return () => {
      map.off("click", handleMapClick);
    };
  }, [isPicking, map, handleMapClick]);

  return (
    <>
      {isPicking && coords && (
        <Popup
          longitude={coords.rawLng}
          latitude={coords.rawLat}
          closeButton={false}
          closeOnClick={false}
          anchor="top-left"
          offset={15}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#333",
              whiteSpace: "nowrap",
            }}
          >
            Click map to copy [{coords.lat}, {coords.lng}]
          </div>
        </Popup>
      )}

      <div
        className={`mlt-panel mlt-coordinate-display ${isDark ? "mlt-dark" : ""} ${className}`.trim()}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 12px",
          gap: "12px",
          minWidth: "240px",
          ...(backgroundColor ? { background: backgroundColor } : {}),
          ...style,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "var(--mlt-text-muted)",
              letterSpacing: "0.5px",
            }}
          >
            COORDINATES
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: coords ? "var(--mlt-text)" : "var(--mlt-text-muted)",
            }}
          >
            {coords ? `${coords.lat}° N, ${coords.lng}° E` : "Move cursor on map"}
          </span>
        </div>

        {showCopyButton && (
          <button
            type="button"
            className={`mlt-icon-btn ${isPicking ? "mlt-icon-btn-active" : ""}`}
            style={{ marginLeft: "auto", width: 28, height: 28 }}
            onClick={() => setIsPicking(!isPicking)}
            title={
              isPicking
                ? "Click on map to copy coordinates"
                : "Pick & Copy Coordinates"
            }
          >
            <CopyIcon size={14} />
          </button>
        )}
      </div>
    </>
  );
};

export default CoordinateDisplay;
