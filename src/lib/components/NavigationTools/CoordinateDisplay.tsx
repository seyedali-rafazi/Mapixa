import { useState, useEffect, useCallback, useRef, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { CopyIcon, CheckIcon } from "../ui/Icons";
import { copyToClipboard } from "../../utils/exportUtils";
import { isDarkColor } from "../../utils/colorUtils";
import { toast } from "sonner";

export interface CoordinateDisplayProps {
  /**
   * Number of decimal places for latitude and longitude.
   * Defaults to 5.
   */
  precision?: number;
  /**
   * Whether to display the copy button in the center.
   * Defaults to true.
   */
  showCopyButton?: boolean;
  /**
   * Optional custom background color for the pill capsule.
   * Defaults to #313334.
   */
  backgroundColor?: string;
  /**
   * Optional custom styles.
   */
  style?: React.CSSProperties;
  /**
   * Optional additional CSS classes.
   */
  className?: string;
  /**
   * Optional callback when coordinates are copied.
   */
  onCopy?: (coords: {
    lat: string;
    lng: string;
    rawLat: number;
    rawLng: number;
    text: string;
  }) => void;
}

export const CoordinateDisplay: FC<CoordinateDisplayProps> = ({
  precision = 5,
  showCopyButton = true,
  backgroundColor,
  style,
  className = "",
  onCopy,
}) => {
  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [coords, setCoords] = useState<{
    lng: string;
    lat: string;
    rawLng: number;
    rawLat: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);
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

    const handleMouseOut = (e: any) => {
      const related = e?.originalEvent?.relatedTarget as HTMLElement | null;
      if (
        containerRef.current &&
        related &&
        containerRef.current.contains(related)
      ) {
        // Pointer moved directly into coordinate display capsule
        return;
      }
      setCoords(null);
    };

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

      toast.dismiss("coord-pick-toast");

      copyToClipboard(text).then(() => {
        setCopied(true);
        toast.success(`Copied coordinates: ${text}`);
        onCopy?.({
          lat: lat.toFixed(precision),
          lng: lng.toFixed(precision),
          rawLat: lat,
          rawLng: lng,
          text,
        });
        setTimeout(() => setCopied(false), 1800);
      });

      setIsPicking(false);
      if (e.target?.getCanvas) {
        e.target.getCanvas().style.cursor = "";
      }
    },
    [precision, onCopy]
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
      if (map.getCanvas) {
        map.getCanvas().style.cursor = "";
      }
    };
  }, [isPicking, map, handleMapClick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPicking) {
        toast.dismiss("coord-pick-toast");
        setIsPicking(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPicking]);

  const handleTogglePick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isPicking) {
      toast.info("Click anywhere on the map to copy coordinates", {
        id: "coord-pick-toast",
      });
      setIsPicking(true);
    } else {
      toast.dismiss("coord-pick-toast");
      setIsPicking(false);
    }
  };

  const displayLat = coords ? coords.lat : "-";
  const displayLng = coords ? coords.lng : "-";

  const isDark = isDarkColor(backgroundColor ?? "#313334");

  return (
    <div
      ref={containerRef}
      className={`mlt-coordinate-display ${isDark ? "mlt-dark" : "mlt-light"} ${className}`.trim()}
      style={{
        ...(backgroundColor ? { background: backgroundColor } : {}),
        ...style,
      }}
      onMouseLeave={() => {
        setCoords(null);
      }}
      title="Coordinates: Lat, Lon"
    >
      <span className="mlt-coord-label">Lat</span>
      <span className="mlt-coord-value">{displayLat}</span>

      {showCopyButton && (
        <button
          type="button"
          className={`mlt-coord-copy-btn ${isPicking ? "mlt-coord-picking" : ""} ${copied ? "mlt-coord-copied" : ""}`}
          onClick={handleTogglePick}
          title={
            isPicking
              ? "Click on map to copy coordinates (or click to cancel)"
              : copied
                ? "Copied to clipboard!"
                : "Click to pick and copy coordinates from map"
          }
          aria-label="Copy coordinates from map"
        >
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
        </button>
      )}

      <span className="mlt-coord-value">{displayLng}</span>
      <span className="mlt-coord-label">Lon</span>
    </div>
  );
};

export default CoordinateDisplay;

