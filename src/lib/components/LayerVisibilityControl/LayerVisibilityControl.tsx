import { useState, type MouseEvent, type FC } from "react";
import {
  EyeIcon,
  EyeOffIcon,
  PinIcon,
  LineIcon,
  PolygonIcon,
  CircleIcon,
  RectangleIcon,
  FreehandIcon,
  RulerIcon,
  ImageIcon,
} from "../ui/Icons";
import { Popover } from "../ui/Popover";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import type { ToolType } from "../../types/tools";

interface LayerItem {
  id: ToolType;
  label: string;
  icon: FC<{ size?: number; style?: React.CSSProperties }>;
}

const LAYER_ITEMS: LayerItem[] = [
  { id: "marker", label: "Markers", icon: PinIcon },
  { id: "line", label: "Lines", icon: LineIcon },
  { id: "polygon", label: "Polygons", icon: PolygonIcon },
  { id: "circle", label: "Circles", icon: CircleIcon },
  { id: "rectangle", label: "Rectangles", icon: RectangleIcon },
  { id: "freedraw", label: "Freehand Drawings", icon: FreehandIcon },
  { id: "ruler", label: "Ruler Measurements", icon: RulerIcon },
  { id: "overlay", label: "Image Overlays", icon: ImageIcon },
];

export interface LayerVisibilityControlProps {
  buttonSize?: number;
  placement?: "left" | "right" | "top" | "bottom";
}

export function LayerVisibilityControl({
  buttonSize = 36,
}: LayerVisibilityControlProps) {
  const { visibility, toggleToolVisibility, setAllVisibility } =
    useLayerVisibility();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const allVisible = Object.values(visibility).every(Boolean);

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${open ? "mlt-icon-btn-active" : ""}`}
        style={{ width: buttonSize, height: buttonSize }}
        onClick={handleClick}
        title="Layer Visibility"
      >
        {allVisible ? <EyeIcon size={18} /> : <EyeOffIcon size={18} />}
      </button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        width={250}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
              Layer Visibility
            </span>
            <button
              type="button"
              className="mlt-btn mlt-btn-secondary"
              onClick={() => setAllVisibility(!allVisible)}
              style={{ fontSize: "0.7rem", padding: "2px 6px" }}
            >
              {allVisible ? "Hide All" : "Show All"}
            </button>
          </div>

          <div style={{ width: "100%", height: "1px", backgroundColor: "var(--mlt-border)" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {LAYER_ITEMS.map((item) => {
              const Icon = item.icon;
              const isVisible = visibility[item.id] ?? true;

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleToolVisibility(item.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon
                      size={16}
                      style={{
                        color: isVisible ? "#2563eb" : "var(--mlt-text-muted)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: isVisible ? "var(--mlt-text)" : "var(--mlt-text-muted)",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => {}}
                    style={{ cursor: "pointer", accentColor: "#2563eb" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Popover>
    </>
  );
}

export default LayerVisibilityControl;
